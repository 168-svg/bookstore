import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { adminMiddleware, authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取所有分类及子分类（公开）
router.get('/', async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  const allSubs = db.prepare('SELECT * FROM sub_categories ORDER BY sort_order').all()

  const result = categories.map((cat) => {
    const subs = allSubs.filter(sub => Number(sub.category_id) === Number(cat.id))
    return { ...cat, subs }
  })

  res.json({ code: 0, data: result })
})

// 管理员：添加分类
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, sort_order } = req.body
  if (!name) {
    return res.json({ code: 400, msg: '分类名称不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const existing = await db.prepare('SELECT id FROM categories WHERE name = ?').get(name)
  if (existing) {
    return res.json({ code: 400, msg: '分类已存在' })
  }

  const result = await db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, sort_order || 0)
  res.json({ code: 0, msg: '添加成功', data: { id: result.lastInsertRowid } })
})

// 管理员：更新分类
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, sort_order } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  const updates = []
  const values = []
  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (sort_order !== undefined) {
    updates.push('sort_order = ?')
    values.push(sort_order)
  }

  if (updates.length === 0) {
    return res.json({ code: 400, msg: '没有需要更新的字段' })
  }

  values.push(req.params.id)
  await db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ code: 0, msg: '更新成功' })
})

// 管理员：删除分类
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  await db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ code: 0, msg: '删除成功' })
})

// 管理员：添加子分类
router.post('/sub', authMiddleware, adminMiddleware, async (req, res) => {
  const { category_id, name, color, sort_order } = req.body
  if (!category_id || !name) {
    return res.json({ code: 400, msg: '分类ID和子分类名称不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const result = await db.prepare('INSERT INTO sub_categories (category_id, name, color, sort_order) VALUES (?, ?, ?, ?)').run(category_id, name, color || '#E2DFD7', sort_order || 0)
  res.json({ code: 0, msg: '添加成功', data: { id: result.lastInsertRowid } })
})

// 管理员：更新子分类
router.put('/sub/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, color, sort_order } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  const updates = []
  const values = []
  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (color !== undefined) {
    updates.push('color = ?')
    values.push(color)
  }
  if (sort_order !== undefined) {
    updates.push('sort_order = ?')
    values.push(sort_order)
  }

  if (updates.length === 0) {
    return res.json({ code: 400, msg: '没有需要更新的字段' })
  }

  values.push(req.params.id)
  await db.prepare(`UPDATE sub_categories SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ code: 0, msg: '更新成功' })
})

// 管理员：删除子分类
router.delete('/sub/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  await db.prepare('DELETE FROM sub_categories WHERE id = ?').run(req.params.id)
  res.json({ code: 0, msg: '删除成功' })
})

export default router
