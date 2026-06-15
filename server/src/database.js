import initSqlJs from 'sql.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'bookstore.db')

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db = null

export async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()

  // 如果数据库文件存在，则加载
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON')

  return db
}

// 保存数据库到文件
export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

export function closeDb() {
  if (db) {
    saveDb()
    db.close()
    db = null
  }
}

// 包装 db.prepare 以兼容 sql.js API
// sql.js 的 prepare 返回 stmt 对象，用法与 better-sqlite3 略有不同
// 这里提供兼容层
export function prepareWrapper(db) {
  return {
    run(...params) {
      db.run(this._sql, params)
      return { lastInsertRowid: getlastInsertRowid(db), changes: getChanges(db) }
    },
    get(...params) {
      const stmt = db.prepare(this._sql)
      stmt.bind(params)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return undefined
    },
    all(...params) {
      const results = []
      const stmt = db.prepare(this._sql)
      stmt.bind(params)
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    },
  }
}

function getlastInsertRowid(db) {
  // sql.js 不支持在 exec 中带参数，用 prepare + step 来获取
  const stmt = db.prepare('SELECT last_insert_rowid() as id')
  stmt.step()
  const row = stmt.getAsObject()
  stmt.free()
  return row.id
}

function getChanges(db) {
  const result = db.exec('SELECT changes() as cnt')
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0]
  }
  return 0
}

// 创建兼容 better-sqlite3 API 的包装器
export function createDbWrapper(db) {
  return {
    prepare(sql) {
      return {
        run(...params) {
          if (params.length > 0) {
            const stmt = db.prepare(sql)
            stmt.bind(params)
            stmt.step()
            stmt.free()
          } else {
            db.run(sql)
          }
          const id = getlastInsertRowid(db)
          const changes = getChanges(db)
          saveDb()
          return { lastInsertRowid: id, changes }
        },
        get(...params) {
          const stmt = db.prepare(sql)
          stmt.bind(params)
          if (stmt.step()) {
            const row = stmt.getAsObject()
            stmt.free()
            return row
          }
          stmt.free()
          return undefined
        },
        all(...params) {
          const results = []
          const stmt = db.prepare(sql)
          stmt.bind(params)
          while (stmt.step()) {
            results.push(stmt.getAsObject())
          }
          stmt.free()
          return results
        },
      }
    },
    exec(sql) {
      db.run(sql)
      saveDb()
    },
    transaction(fn) {
      return function (...args) {
        db.run('BEGIN TRANSACTION')
        try {
          const result = fn(...args)
          db.run('COMMIT')
          saveDb()
          return result
        } catch (err) {
          db.run('ROLLBACK')
          throw err
        }
      }
    },
  }
}
