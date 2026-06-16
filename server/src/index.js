import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import { initDatabase } from './init-db.js'
import authRoutes from './routes/auth.js'
import bookRoutes from './routes/books.js'
import categoryRoutes from './routes/categories.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import reviewsRoutes from './routes/reviews.js'
import userRoutes from './routes/users.js'
import addressRoutes from './routes/addresses.js'
import favoriteRoutes from './routes/favorites.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8080

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件（封面图片等）
app.use('/uploads', express.static('uploads'))

// 路由
app.use('/auth', authRoutes)
app.use('/books', bookRoutes)
app.use('/categories', categoryRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/reviews', reviewsRoutes)
app.use('/users', userRoutes)
app.use('/addresses', addressRoutes)
app.use('/favorites', favoriteRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 0, msg: 'ok' })
})

// H5 前端静态资源（uni-app 构建产物）
const h5Dist = path.join(__dirname, '..', 'public')
if (fs.existsSync(h5Dist)) {
  app.use(express.static(h5Dist, {
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  }))
}

// SPA fallback: 所有非 API 的 GET 请求回退到 index.html（uni-app H5 路由）
app.get('*', (req, res, next) => {
  const apiPrefixes = ['/auth/', '/books', '/categories', '/cart', '/orders', '/reviews', '/users', '/health', '/uploads', '/api-docs']
  if (req.path.startsWith('/api') || apiPrefixes.some(p => req.path.startsWith(p))) {
    return next()
  }
  const indexPath = path.join(h5Dist, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  }
  else {
    // H5 尚未构建时显示友好提示
    res.type('html').send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>二手书 - H5 构建中</title></head>
      <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F8F6F2;">
        <div style="text-align:center;color:#365F47;">
          <h1>📚 二手书平台</h1>
          <p>H5 前端正在构建中，请稍后刷新。</p>
          <p style="color:#888;font-size:14px;">
            后端 API 已就绪，可访问 <a href="/health" style="color:#365F47;">/health</a> 或
            <a href="/api-docs" style="color:#365F47;">/api-docs</a>
          </p>
        </div>
      </body></html>
    `)
  }
})

// 异步启动
async function start() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`)
    console.log(`  - 后端 API: http://localhost:${PORT}/health`)
    if (fs.existsSync(h5Dist)) {
      console.log(`  - H5 前端: http://localhost:${PORT}/`)
    }
    else {
      console.log(`  - H5 前端: 未构建 (需要执行 npm run build:h5)`)
    }
  })
}

start()
