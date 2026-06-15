import { Router } from 'express'
import { createDbWrapper, getDb } from '../database.js'
import { adminMiddleware, authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取我的订单
router.get('/', authMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const { status, page = 1, pageSize = 20 } = req.query

  let where = 'WHERE o.buyer_id = ?'
  const params = [req.user.userId]

  if (status) {
    where += ' AND o.status = ?'
    params.push(status)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params)
  const offset = (Number(page) - 1) * Number(pageSize)

  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(oi.title) as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${where}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

  // 获取每个订单的详情项
  const result = orders.map((order) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    return { ...order, items }
  })

  res.json({
    code: 0,
    data: {
      list: result,
      total: countRow.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  })
})

// 创建订单
router.post('/', authMiddleware, async (req, res) => {
  const { address } = req.body
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  // 获取已选购物车项
  const cartItems = db.prepare(`
    SELECT ci.*, b.title, b.price, b.color
    FROM cart_items ci
    LEFT JOIN books b ON ci.book_id = b.id
    WHERE ci.user_id = ? AND ci.checked = 1
  `).all(req.user.userId)

  if (cartItems.length === 0) {
    return res.json({ code: 400, msg: '购物车中没有选中的商品' })
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = 3.00
  const orderNo = Date.now().toString()

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, buyer_id, total_price, shipping_fee, status, address)
    VALUES (?, ?, ?, ?, '待发货', ?)
  `)

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, book_id, title, price, quantity, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const deleteCart = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND checked = 1')
  const updateBookStatus = db.prepare('UPDATE books SET status = \'sold\' WHERE id = ?')

  const transaction = db.transaction(() => {
    const orderResult = insertOrder.run(orderNo, req.user.userId, totalPrice + shippingFee, shippingFee, address || '')
    const orderId = orderResult.lastInsertRowid

    for (const item of cartItems) {
      insertItem.run(orderId, item.book_id, item.title, item.price, item.quantity, item.color || '')
      updateBookStatus.run(item.book_id)
    }

    deleteCart.run(req.user.userId)

    return orderId
  })

  const orderId = transaction()

  res.json({ code: 0, msg: '下单成功', data: { orderId, orderNo } })
})

// 更新订单状态
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body
  const validStatuses = ['待付款', '待发货', '待收货', '已完成', '已取消']
  if (!validStatuses.includes(status)) {
    return res.json({ code: 400, msg: '无效的订单状态' })
  }

  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.json({ code: 404, msg: '订单不存在' })
  }

  // 只有买家可以确认收货，管理员可以修改任何状态
  if (status === '已完成' && order.buyer_id !== req.user.userId && req.user.role !== 'admin') {
    return res.json({ code: 403, msg: '无权操作' })
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(status, req.params.id)
  res.json({ code: 0, msg: '状态更新成功' })
})

// 管理员：获取所有订单
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)
  const { status, keyword, page = 1, pageSize = 20 } = req.query

  let where = 'WHERE 1=1'
  const params = []

  if (status) {
    where += ' AND o.status = ?'
    params.push(status)
  }
  if (keyword) {
    where += ' AND o.order_no LIKE ?'
    params.push(`%${keyword}%`)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params)
  const offset = (Number(page) - 1) * Number(pageSize)

  const orders = db.prepare(`
    SELECT o.*, u.nickname as buyer_name
    FROM orders o
    LEFT JOIN users u ON o.buyer_id = u.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

  const result = orders.map((order) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    return { ...order, items }
  })

  res.json({
    code: 0,
    data: {
      list: result,
      total: countRow.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  })
})

export default router
