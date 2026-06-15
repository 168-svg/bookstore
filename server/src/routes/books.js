import { Router } from 'express'
import { getDb, createDbWrapper } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async(req, res) => {
    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const { keyword, category_id, sub_category_id, status, page = 1, pageSize = 20 } = req.query

    let where = 'WHERE 1=1'
    const params = []

    if (keyword) {
        where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)'
        const kw = `%${keyword}%`
        params.push(kw, kw, kw)
    }
    if (category_id) {
        where += ' AND sc.category_id = ?'
        params.push(Number(category_id))
    }
    if (sub_category_id) {
        where += ' AND b.sub_category_id = ?'
        params.push(Number(sub_category_id))
    }
    if (status) {
        where += ' AND b.status = ?'
        params.push(status)
    } else {
        where += " AND b.status = 'on_sale'"
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM books b LEFT JOIN sub_categories sc ON b.sub_category_id = sc.id ${where}`).get(...params)
    const total = countRow.total

    const offset = (Number(page) - 1) * Number(pageSize)
    const books = db.prepare(`
    SELECT b.*, u.nickname as seller_name, sc.name as sub_category_name
    FROM books b
    LEFT JOIN users u ON b.seller_id = u.id
    LEFT JOIN sub_categories sc ON b.sub_category_id = sc.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

    res.json({
        code: 0,
        data: {
            list: books,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
        },
    })
})

router.get('/admin/all', authMiddleware, adminMiddleware, async(req, res) => {
    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const { keyword, status, page = 1, pageSize = 20 } = req.query

    let where = 'WHERE 1=1'
    const params = []

    if (keyword) {
        where += ' AND (b.title LIKE ? OR b.author LIKE ?)'
        const kw = `%${keyword}%`
        params.push(kw, kw)
    }
    if (status) {
        where += ' AND b.status = ?'
        params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM books b ${where}`).get(...params)
    const offset = (Number(page) - 1) * Number(pageSize)

    const books = db.prepare(`
    SELECT b.*, u.nickname as seller_name
    FROM books b
    LEFT JOIN users u ON b.seller_id = u.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

    res.json({
        code: 0,
        data: {
            list: books,
            total: countRow.total,
            page: Number(page),
            pageSize: Number(pageSize),
        },
    })
})

router.get('/:id', async(req, res) => {
    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const book = db.prepare(`
    SELECT b.*, u.nickname as seller_name
    FROM books b
    LEFT JOIN users u ON b.seller_id = u.id
    WHERE b.id = ?
  `).get(req.params.id)

    if (!book) {
        return res.json({ code: 404, msg: '书籍不存在' })
    }

    res.json({ code: 0, data: book })
})

router.post('/', authMiddleware, async(req, res) => {
    const { title, author, price, original_price, color, condition, publisher, publish_date, isbn, description, sub_category_id } = req.body

    if (!title || !author || !price) {
        return res.json({ code: 400, msg: '书名、作者和价格不能为空' })
    }

    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const result = db.prepare(`
    INSERT INTO books (title, author, price, original_price, color, condition, publisher, publish_date, isbn, description, sub_category_id, seller_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, author, price, original_price || 0, color || '#2c3e50', condition || '8成新', publisher || '', publish_date || '', isbn || '', description || '', sub_category_id || null, req.user.userId)

    res.json({ code: 0, msg: '发布成功', data: { id: result.lastInsertRowid } })
})

router.put('/:id', authMiddleware, async(req, res) => {
    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id)
    if (!book) {
        return res.json({ code: 404, msg: '书籍不存在' })
    }
    if (book.seller_id !== req.user.userId && req.user.role !== 'admin') {
        return res.json({ code: 403, msg: '无权修改' })
    }

    const { title, author, price, original_price, color, condition, publisher, publish_date, isbn, description, sub_category_id, status } = req.body
    const updates = []
    const values = []

    if (title !== undefined) { updates.push('title = ?');
        values.push(title) }
    if (author !== undefined) { updates.push('author = ?');
        values.push(author) }
    if (price !== undefined) { updates.push('price = ?');
        values.push(price) }
    if (original_price !== undefined) { updates.push('original_price = ?');
        values.push(original_price) }
    if (color !== undefined) { updates.push('color = ?');
        values.push(color) }
    if (condition !== undefined) { updates.push('condition = ?');
        values.push(condition) }
    if (publisher !== undefined) { updates.push('publisher = ?');
        values.push(publisher) }
    if (publish_date !== undefined) { updates.push('publish_date = ?');
        values.push(publish_date) }
    if (isbn !== undefined) { updates.push('isbn = ?');
        values.push(isbn) }
    if (description !== undefined) { updates.push('description = ?');
        values.push(description) }
    if (sub_category_id !== undefined) { updates.push('sub_category_id = ?');
        values.push(sub_category_id) }
    if (status !== undefined) { updates.push('status = ?');
        values.push(status) }

    if (updates.length === 0) {
        return res.json({ code: 400, msg: '没有需要更新的字段' })
    }

    updates.push("updated_at = datetime('now', 'localtime')")
    values.push(req.params.id)

    db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    res.json({ code: 0, msg: '更新成功' })
})

router.delete('/:id', authMiddleware, async(req, res) => {
    const rawDb = await getDb()
    const db = createDbWrapper(rawDb)
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id)
    if (!book) {
        return res.json({ code: 404, msg: '书籍不存在' })
    }
    if (book.seller_id !== req.user.userId && req.user.role !== 'admin') {
        return res.json({ code: 403, msg: '无权删除' })
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id)
    res.json({ code: 0, msg: '删除成功' })
})

export default router