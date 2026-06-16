import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取我的所有地址
router.get('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.userId)
  res.json({
    code: 0,
    data: addresses,
  })
})

// 新增地址
router.post('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const { name, phone, address, is_default = 0 } = req.body

  if (!name || !phone || !address) {
    return res.json({ code: 400, msg: '收件人、电话和地址不能为空' })
  }

  const transaction = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.userId)
    }
    const result = db.prepare(`
      INSERT INTO addresses (user_id, name, phone, address, is_default)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.userId, name, phone, address, is_default ? 1 : 0)
    return result.lastInsertRowid
  })

  const id = transaction()
  res.json({ code: 0, msg: '添加成功', data: { id } })
})

// 更新地址
router.put('/:id', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id)
  if (!addr) {
    return res.json({ code: 404, msg: '地址不存在' })
  }
  if (addr.user_id !== req.user.userId) {
    return res.json({ code: 403, msg: '无权操作' })
  }

  const { name, phone, address, is_default } = req.body

  const transaction = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.userId)
    }
    const updates = []
    const values = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone) }
    if (address !== undefined) { updates.push('address = ?'); values.push(address) }
    if (is_default !== undefined) { updates.push('is_default = ?'); values.push(is_default ? 1 : 0) }
    if (updates.length === 0) {
      return null
    }
    values.push(req.params.id)
    db.prepare(`UPDATE addresses SET ${updates.join(', ')}, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(...values)
    return true
  })
  transaction()

  res.json({ code: 0, msg: '更新成功' })
})

// 删除地址
router.delete('/:id', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id)
  if (!addr) {
    return res.json({ code: 404, msg: '地址不存在' })
  }
  if (addr.user_id !== req.user.userId) {
    return res.json({ code: 403, msg: '无权操作' })
  }

  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id)
  res.json({ code: 0, msg: '删除成功' })
})

// 设为默认
router.put('/:id/default', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id)
  if (!addr) {
    return res.json({ code: 404, msg: '地址不存在' })
  }
  if (addr.user_id !== req.user.userId) {
    return res.json({ code: 403, msg: '无权操作' })
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.userId)
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(req.params.id)
  })
  transaction()

  res.json({ code: 0, msg: '设置成功' })
})

export default router
