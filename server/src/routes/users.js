import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { adminMiddleware, authMiddleware } from '../middleware/auth.js'

const router = Router()

// 管理员：获取所有用户
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const { keyword, role, page = 1, pageSize = 20 } = req.query

  let where = 'WHERE 1=1'
  const params = []

  if (keyword) {
    where += ' AND (username LIKE ? OR nickname LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw)
  }
  if (role) {
    where += ' AND role = ?'
    params.push(role)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params)
  const offset = (Number(page) - 1) * Number(pageSize)

  const users = db.prepare(`
    SELECT id, username, nickname, avatar, role, sex, created_at, updated_at
    FROM users
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

  res.json({
    code: 0,
    data: {
      list: users,
      total: countRow.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  })
})

// 管理员：更新用户角色
router.put('/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) {
    return res.json({ code: 400, msg: '无效的角色' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(role, req.params.id)
  res.json({ code: 0, msg: '角色更新成功' })
})

// 管理员：删除用户
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  // 不能删除自己
  if (Number(req.params.id) === req.user.userId) {
    return res.json({ code: 400, msg: '不能删除自己' })
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ code: 0, msg: '删除成功' })
})

// 管理员：重置用户密码
router.put('/:id/password', authMiddleware, adminMiddleware, async (req, res) => {
  const { password } = req.body
  if (!password) {
    return res.json({ code: 400, msg: '密码不能为空' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(password, req.params.id)
  res.json({ code: 0, msg: '密码重置成功' })
})

// 管理员：获取统计数据
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
  const totalSales = db.prepare('SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status != \'已取消\'').get().total
  const onSaleCount = db.prepare('SELECT COUNT(*) as count FROM books WHERE status = \'on_sale\'').get().count
  const pendingOrderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status IN (\'待付款\', \'待发货\')').get().count

  res.json({
    code: 0,
    data: {
      userCount,
      bookCount,
      orderCount,
      totalSales,
      onSaleCount,
      pendingOrderCount,
    },
  })
})

export default router
