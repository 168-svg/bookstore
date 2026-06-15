import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'

const router = Router()

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

  if (!user || user.password !== password) {
    return res.json({ code: 400, msg: '用户名或密码错误' })
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role })

  res.json({
    code: 0,
    msg: '登录成功',
    data: {
      token,
      expiresIn: 7 * 24 * 3600,
    },
  })
})

// 注册
router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body
  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.json({ code: 400, msg: '用户名已存在' })
  }

  const result = db.prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)').run(username, password, nickname || username)
  const token = generateToken({ userId: result.lastInsertRowid, username, role: 'user' })

  res.json({
    code: 0,
    msg: '注册成功',
    data: {
      token,
      expiresIn: 7 * 24 * 3600,
    },
  })
})

// 获取当前用户信息
router.get('/info', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const user = db.prepare('SELECT id, username, nickname, avatar, role, sex, created_at FROM users WHERE id = ?').get(req.user.userId)

  if (!user) {
    return res.json({ code: 404, msg: '用户不存在' })
  }

  res.json({
    code: 0,
    data: {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || '',
      role: user.role,
      sex: user.sex,
      createdAt: user.created_at,
    },
  })
})

// 更新用户信息
router.post('/updateInfo', authMiddleware, async (req, res) => {
  const { nickname, sex, avatar } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  const updates = []
  const values = []
  if (nickname !== undefined) {
    updates.push('nickname = ?')
    values.push(nickname)
  }
  if (sex !== undefined) {
    updates.push('sex = ?')
    values.push(sex)
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?')
    values.push(avatar)
  }

  if (updates.length === 0) {
    return res.json({ code: 400, msg: '没有需要更新的字段' })
  }

  updates.push('updated_at = datetime(\'now\', \'localtime\')')
  values.push(req.user.userId)

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  res.json({ code: 0, msg: '更新成功' })
})

// 修改密码
router.post('/updatePassword', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.json({ code: 400, msg: '旧密码和新密码不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.userId)
  if (!user || user.password !== oldPassword) {
    return res.json({ code: 400, msg: '旧密码错误' })
  }

  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(newPassword, req.user.userId)

  res.json({ code: 0, msg: '密码修改成功' })
})

export default router
