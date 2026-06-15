import { Router } from 'express'
import { getDb, createDbWrapper } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取购物车
router.get('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const items = await db.prepare(`
    SELECT ci.*, b.title, b.author, b.price, b.color, b.condition, b.cover_url
    FROM cart_items ci
    LEFT JOIN books b ON ci.book_id = b.id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
  `).all(req.user.userId)

  res.json({ code: 0, data: items })
})

// 添加到购物车
router.post('/', authMiddleware, async (req, res) => {
  const { book_id, quantity } = req.body
  if (!book_id) {
    return res.json({ code: 400, msg: '书籍ID不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const existing = await db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND book_id = ?').get(req.user.userId, book_id)

  if (existing) {
    await db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity || 1, existing.id)
  } else {
    await db.prepare('INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)').run(req.user.userId, book_id, quantity || 1)
  }

  res.json({ code: 0, msg: '已加入购物车' })
})

// 更新购物车项
router.put('/:id', authMiddleware, async (req, res) => {
  const { quantity, checked } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  const item = await db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId)
  if (!item) {
    return res.json({ code: 404, msg: '购物车项不存在' })
  }

  if (quantity !== undefined) {
    if (quantity <= 0) {
      await db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id)
      return res.json({ code: 0, msg: '已移除' })
    }
    await db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id)
  }

  if (checked !== undefined) {
    await db.prepare('UPDATE cart_items SET checked = ? WHERE id = ?').run(checked ? 1 : 0, req.params.id)
  }

  res.json({ code: 0, msg: '更新成功' })
})

// 删除购物车项
router.delete('/:id', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  await db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId)
  res.json({ code: 0, msg: '已移除' })
})

// 全选/取消全选
router.post('/toggleAll', authMiddleware, async (req, res) => {
  const { checked } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  await db.prepare('UPDATE cart_items SET checked = ? WHERE user_id = ?').run(checked ? 1 : 0, req.user.userId)
  res.json({ code: 0, msg: '操作成功' })
})

// 清空已选
router.post('/clearChecked', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  await db.prepare('DELETE FROM cart_items WHERE user_id = ? AND checked = 1').run(req.user.userId)
  res.json({ code: 0, msg: '已清空' })
})

export default router
