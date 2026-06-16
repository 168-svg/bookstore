import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取我的收藏列表
router.get('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const favorites = db.prepare(`
    SELECT f.id as favorite_id, b.*, u.nickname as seller_name
    FROM favorites f
    LEFT JOIN books b ON f.book_id = b.id
    LEFT JOIN users u ON b.seller_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.userId)

  res.json({
    code: 0,
    data: {
      list: favorites,
      total: favorites.length,
    },
  })
})

// 添加收藏
router.post('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const { book_id } = req.body
  if (!book_id) {
    return res.json({ code: 400, msg: 'book_id 不能为空' })
  }
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id)
  if (!book) {
    return res.json({ code: 404, msg: '书籍不存在' })
  }

  try {
    db.prepare('INSERT INTO favorites (user_id, book_id) VALUES (?, ?)').run(req.user.userId, book_id)
  } catch (e) {
    // 可能已经收藏过
  }
  res.json({ code: 0, msg: '收藏成功' })
})

// 取消收藏
router.delete('/:book_id', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND book_id = ?').run(req.user.userId, req.params.book_id)
  res.json({ code: 0, msg: '取消收藏成功' })
})

// 检查是否收藏
router.get('/:book_id', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?').get(req.user.userId, req.params.book_id)
  res.json({
    code: 0,
    data: {
      is_favorite: !!fav,
    },
  })
})

export default router
