import { Router } from 'express'
import { getDb, createDbWrapper } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function ensureReviewsTable(db) {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'").get()
  if (!tableCheck) {
    db.prepare(`
      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        nickname TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run()
  }
}

router.get('/:bookId', async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  ensureReviewsTable(db)

  const bookId = Number(req.params.bookId)
  const reviews = db.prepare('SELECT * FROM reviews WHERE book_id = ? ORDER BY id DESC').all(bookId)
  const stats = db.prepare('SELECT COUNT(*) as total, AVG(rating) as avg FROM reviews WHERE book_id = ?').get(bookId)

  res.json({
    code: 0,
    data: {
      list: reviews,
      total: stats.total || 0,
      avgRating: stats.avg ? Number(stats.avg.toFixed(1)) : 0,
    },
  })
})

router.post('/', authMiddleware, async (req, res) => {
  const { book_id, rating, content } = req.body
  if (!book_id || !content) {
    return res.json({ code: 400, msg: '书评内容不能为空' })
  }
  const r = Number(rating) || 5
  if (r < 1 || r > 5) {
    return res.json({ code: 400, msg: '评分必须在 1 到 5 之间' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  ensureReviewsTable(db)

  const result = db.prepare('INSERT INTO reviews (book_id, user_id, nickname, rating, content) VALUES (?, ?, ?, ?, ?)')
    .run(Number(book_id), req.user.userId, req.user.nickname || '用户', r, String(content))

  res.json({ code: 0, msg: '发表成功', data: { id: result.lastInsertRowid } })
})

export default router
