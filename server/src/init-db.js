import { getDb, createDbWrapper, saveDb } from './database.js'

export async function initDatabase() {
  const rawDb = await getDb()
  const db = createDbWrapper(rawDb)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      sex TEXT DEFAULT '未知',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sub_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#E2DFD7',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL DEFAULT 0,
      color TEXT DEFAULT '#2c3e50',
      condition TEXT DEFAULT '8成新',
      publisher TEXT DEFAULT '',
      publish_date TEXT DEFAULT '',
      isbn TEXT DEFAULT '',
      description TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      seller_id INTEGER NOT NULL,
      sub_category_id INTEGER,
      status TEXT NOT NULL DEFAULT 'on_sale',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      buyer_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      shipping_fee REAL DEFAULT 3.00,
      status TEXT NOT NULL DEFAULT '待付款',
      address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (buyer_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      color TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      checked INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(user_id, book_id)
    )
  `)

  // 插入默认超级管理员（密码: admin123）
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (!adminExists) {
    db.prepare('INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)').run('admin', 'admin123', '超级管理员', 'super_admin')
  }

  // 若存在 username='admin' 且 role 为 'admin'，升级为 super_admin（兼容旧数据库）
  const legacyAdmin = db.prepare("SELECT id FROM users WHERE username = 'admin' AND role = 'admin'").get()
  if (legacyAdmin) {
    db.prepare("UPDATE users SET role = 'super_admin', updated_at = datetime('now', 'localtime') WHERE id = ?").run(legacyAdmin.id)
  }

  // 插入默认分类
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  if (catCount.count === 0) {
    const cats = [
      { name: '文学小说', subs: [
        { name: '现代文学', color: '#E2DFD7' },
        { name: '外国文学', color: '#D4D0C5' },
        { name: '经典名著', color: '#C7C2B4' },
      ]},
      { name: '社科经管', subs: [
        { name: '经济学', color: '#E5E2DA' },
        { name: '管理学', color: '#D8D4C9' },
      ]},
      { name: '历史传记', subs: [
        { name: '中国历史', color: '#D9D3C7' },
        { name: '世界历史', color: '#CFC8BA' },
        { name: '人物传记', color: '#C5BDA9' },
      ]},
      { name: '心理励志', subs: [
        { name: '心理学', color: '#DDD9D0' },
        { name: '励志成长', color: '#D2CCC0' },
      ]},
      { name: '生活艺术', subs: [
        { name: '生活美学', color: '#E0DCD4' },
        { name: '艺术设计', color: '#D6D0C5' },
      ]},
    ]

    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i]
      const result = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(cat.name, i)
      const catId = result.lastInsertRowid
      for (let j = 0; j < cat.subs.length; j++) {
        const sub = cat.subs[j]
        db.prepare('INSERT INTO sub_categories (category_id, name, color, sort_order) VALUES (?, ?, ?, ?)').run(catId, sub.name, sub.color, j)
      }
    }
  }

  // 插入示例书籍
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get()
  if (bookCount.count === 0) {
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')

    const books = [
      { title: '活着', author: '余华', price: 8.90, original_price: 28.00, color: '#1e375a', condition: '8成新', publisher: '作家出版社', publish_date: '2012-08', isbn: '9787506365437', description: '《活着》讲述了一个人历尽世间沧桑和磨难的一生。', subCat: '现代文学' },
      { title: '小王子', author: '圣埃克苏佩里', price: 6.50, original_price: 18.00, color: '#294a4f', condition: '8.5成新', publisher: '译林出版社', publish_date: '2015-05', isbn: '9787544757306', description: '《小王子》是一本写给所有人的童话。关于爱、责任与孤独。', subCat: '外国文学' },
      { title: '百年孤独', author: '马尔克斯', price: 15.00, original_price: 39.50, color: '#4f2929', condition: '9成新', publisher: '南海出版公司', publish_date: '2011-06', isbn: '9787544253994', description: '《百年孤独》是魔幻现实主义文学的代表作。', subCat: '外国文学' },
      { title: '红楼梦', author: '曹雪芹', price: 12.00, original_price: 45.00, color: '#8B2252', condition: '7成新', publisher: '人民文学出版社', publish_date: '2008-07', isbn: '9787020002207', description: '中国古典四大名著之首。', subCat: '经典名著' },
      { title: '三体', author: '刘慈欣', price: 18.00, original_price: 56.00, color: '#1a1a2e', condition: '9成新', publisher: '重庆出版社', publish_date: '2008-01', isbn: '9787229030933', description: '中国科幻文学的里程碑之作。', subCat: '现代文学' },
      { title: '人类简史', author: '尤瓦尔·赫拉利', price: 20.00, original_price: 68.00, color: '#5D4E37', condition: '8成新', publisher: '中信出版社', publish_date: '2014-11', isbn: '9787508647357', description: '从认知革命到科学革命，重新审视人类的历史与未来。', subCat: '世界历史' },
    ]

    for (const book of books) {
      const subCat = db.prepare('SELECT id FROM sub_categories WHERE name = ?').get(book.subCat)
      db.prepare(`
        INSERT INTO books (title, author, price, original_price, color, condition, publisher, publish_date, isbn, description, seller_id, sub_category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(book.title, book.author, book.price, book.original_price, book.color, book.condition, book.publisher, book.publish_date, book.isbn, book.description, admin.id, subCat?.id || null)
    }
  }

  saveDb()
  console.log('数据库初始化完成')
}
