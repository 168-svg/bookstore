import process from 'node:process'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './init-db.js'
import authRoutes from './routes/auth.js'
import bookRoutes from './routes/books.js'
import categoryRoutes from './routes/categories.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import reviewsRoutes from './routes/reviews.js'
import userRoutes from './routes/users.js'

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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 0, msg: 'ok' })
})

// API 文档首页
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>二手书后端 API</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F6F2; color: #333; min-height: 100vh; }
  .header { background: linear-gradient(135deg, #365F47, #2a4a38); color: #fff; padding: 40px 20px; text-align: center; }
  .header h1 { font-size: 28px; margin-bottom: 8px; }
  .header p { opacity: 0.8; font-size: 14px; }
  .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
  .status-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .status-card { flex: 1; min-width: 140px; background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .status-card .label { font-size: 12px; color: #999; margin-bottom: 4px; }
  .status-card .value { font-size: 20px; font-weight: 700; color: #365F47; }
  .status-card .value.ok { color: #52c41a; }
  .group { background: #fff; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .group-title { padding: 14px 20px; font-size: 16px; font-weight: 700; background: #f0ede8; border-bottom: 1px solid #e8e4dd; display: flex; align-items: center; gap: 8px; }
  .group-title .icon { font-size: 20px; }
  .api-item { display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f5f3ef; gap: 12px; cursor: pointer; transition: background 0.15s; }
  .api-item:last-child { border-bottom: none; }
  .api-item:hover { background: #faf8f5; }
  .method { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; min-width: 48px; text-align: center; letter-spacing: 0.5px; }
  .method-get { background: #e8f5e9; color: #2e7d32; }
  .method-post { background: #e3f2fd; color: #1565c0; }
  .method-put { background: #fff3e0; color: #e65100; }
  .method-delete { background: #fce4ec; color: #c62828; }
  .path { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; color: #555; flex: 1; }
  .desc { font-size: 12px; color: #999; }
  .auth-badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #fff8e1; color: #f57f17; }
  .admin-badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #fce4ec; color: #c62828; }
  .try-btn { font-size: 11px; padding: 4px 10px; border-radius: 4px; border: 1px solid #365F47; color: #365F47; background: transparent; cursor: pointer; transition: all 0.15s; }
  .try-btn:hover { background: #365F47; color: #fff; }
  .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 100; justify-content: center; align-items: center; }
  .modal-overlay.active { display: flex; }
  .modal { background: #fff; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: auto; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
  .modal-header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h3 { font-size: 16px; }
  .modal-close { border: none; background: none; font-size: 20px; cursor: pointer; color: #999; }
  .modal-body { padding: 20px; }
  .modal-body pre { background: #f5f3ef; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
  .modal-body .field { margin-bottom: 12px; }
  .modal-body .field label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
  .modal-body .field input, .modal-body .field textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
  .modal-body .field textarea { min-height: 80px; font-family: monospace; }
  .send-btn { width: 100%; padding: 10px; background: #365F47; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 12px; }
  .send-btn:hover { background: #2a4a38; }
  .response-area { margin-top: 16px; }
  .response-area h4 { font-size: 13px; color: #666; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="header">
  <h1>📚 二手书后端 API</h1>
  <p>Bookstore Backend API Documentation</p>
</div>
<div class="container">
  <div class="status-bar">
    <div class="status-card"><div class="label">服务状态</div><div class="value ok" id="healthStatus">检测中...</div></div>
    <div class="status-card"><div class="label">端口</div><div class="value">${PORT}</div></div>
    <div class="status-card"><div class="label">接口总数</div><div class="value" id="apiCount">-</div></div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">🔐</span> 认证模块 /auth</div>
    <div class="api-item" data-method="POST" data-path="/auth/login" data-body='{"username":"admin","password":"admin123"}'>
      <span class="method method-post">POST</span><span class="path">/auth/login</span><span class="desc">用户登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/auth/register" data-body='{"username":"test","password":"123456","nickname":"测试用户"}'>
      <span class="method method-post">POST</span><span class="path">/auth/register</span><span class="desc">用户注册</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="GET" data-path="/auth/info">
      <span class="method method-get">GET</span><span class="path">/auth/info</span><span class="desc">获取用户信息</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/auth/updateInfo" data-body='{"nickname":"新昵称"}'>
      <span class="method method-post">POST</span><span class="path">/auth/updateInfo</span><span class="desc">更新用户信息</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/auth/updatePassword" data-body='{"oldPassword":"admin123","newPassword":"admin456"}'>
      <span class="method method-post">POST</span><span class="path">/auth/updatePassword</span><span class="desc">修改密码</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">📖</span> 图书模块 /books</div>
    <div class="api-item" data-method="GET" data-path="/books">
      <span class="method method-get">GET</span><span class="path">/books</span><span class="desc">获取图书列表</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="GET" data-path="/books/1">
      <span class="method method-get">GET</span><span class="path">/books/:id</span><span class="desc">获取图书详情</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/books" data-body='{"title":"测试书","author":"测试","price":9.9}'>
      <span class="method method-post">POST</span><span class="path">/books</span><span class="desc">发布图书</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="PUT" data-path="/books/1" data-body='{"title":"修改后的书名"}'>
      <span class="method method-put">PUT</span><span class="path">/books/:id</span><span class="desc">更新图书</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="DELETE" data-path="/books/1">
      <span class="method method-delete">DELETE</span><span class="path">/books/:id</span><span class="desc">删除图书</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="GET" data-path="/books/admin/all">
      <span class="method method-get">GET</span><span class="path">/books/admin/all</span><span class="desc">管理-所有图书</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">🏷️</span> 分类模块 /categories</div>
    <div class="api-item" data-method="GET" data-path="/categories">
      <span class="method method-get">GET</span><span class="path">/categories</span><span class="desc">获取分类列表</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/categories" data-body='{"name":"新分类","sort_order":0}'>
      <span class="method method-post">POST</span><span class="path">/categories</span><span class="desc">添加分类</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="PUT" data-path="/categories/1" data-body='{"name":"修改分类名"}'>
      <span class="method method-put">PUT</span><span class="path">/categories/:id</span><span class="desc">更新分类</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="DELETE" data-path="/categories/1">
      <span class="method method-delete">DELETE</span><span class="path">/categories/:id</span><span class="desc">删除分类</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">🛒</span> 购物车模块 /cart</div>
    <div class="api-item" data-method="GET" data-path="/cart">
      <span class="method method-get">GET</span><span class="path">/cart</span><span class="desc">获取购物车</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/cart" data-body='{"book_id":1,"quantity":1}'>
      <span class="method method-post">POST</span><span class="path">/cart</span><span class="desc">加入购物车</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="PUT" data-path="/cart/1" data-body='{"quantity":2}'>
      <span class="method method-put">PUT</span><span class="path">/cart/:id</span><span class="desc">更新购物车项</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="DELETE" data-path="/cart/1">
      <span class="method method-delete">DELETE</span><span class="path">/cart/:id</span><span class="desc">删除购物车项</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/cart/toggleAll" data-body='{"checked":true}'>
      <span class="method method-post">POST</span><span class="path">/cart/toggleAll</span><span class="desc">全选/取消全选</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/cart/clearChecked">
      <span class="method method-post">POST</span><span class="path">/cart/clearChecked</span><span class="desc">清空已选</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">📦</span> 订单模块 /orders</div>
    <div class="api-item" data-method="GET" data-path="/orders">
      <span class="method method-get">GET</span><span class="path">/orders</span><span class="desc">我的订单列表</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="POST" data-path="/orders" data-body='{"address":"北京市朝阳区"}'>
      <span class="method method-post">POST</span><span class="path">/orders</span><span class="desc">创建订单</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="PUT" data-path="/orders/1/status" data-body='{"status":"已完成"}'>
      <span class="method method-put">PUT</span><span class="path">/orders/:id/status</span><span class="desc">更新订单状态</span><span class="auth-badge">需登录</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="GET" data-path="/orders/admin/all">
      <span class="method method-get">GET</span><span class="path">/orders/admin/all</span><span class="desc">管理-所有订单</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>

  <div class="group">
    <div class="group-title"><span class="icon">👥</span> 用户模块 /users</div>
    <div class="api-item" data-method="GET" data-path="/users">
      <span class="method method-get">GET</span><span class="path">/users</span><span class="desc">用户列表</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="PUT" data-path="/users/1/role" data-body='{"role":"admin"}'>
      <span class="method method-put">PUT</span><span class="path">/users/:id/role</span><span class="desc">更新用户角色</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="DELETE" data-path="/users/1">
      <span class="method method-delete">DELETE</span><span class="path">/users/:id</span><span class="desc">删除用户</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
    <div class="api-item" data-method="GET" data-path="/users/admin/stats">
      <span class="method method-get">GET</span><span class="path">/users/admin/stats</span><span class="desc">统计数据</span><span class="admin-badge">管理员</span><button class="try-btn" onclick="tryApi(this)">试一试</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal">
  <div class="modal">
    <div class="modal-header">
      <h3 id="modalTitle">API 测试</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>请求方式</label>
        <input id="reqMethod" readonly>
      </div>
      <div class="field">
        <label>请求路径</label>
        <input id="reqPath" readonly>
      </div>
      <div class="field">
        <label>Token（需要登录的接口请先登录获取 token）</label>
        <input id="reqToken" placeholder="Bearer eyJhbGciOi...">
      </div>
      <div class="field" id="bodyField" style="display:none">
        <label>请求体 (JSON)</label>
        <textarea id="reqBody"></textarea>
      </div>
      <button class="send-btn" onclick="sendRequest()">发送请求</button>
      <div class="response-area" id="responseArea" style="display:none">
        <h4>响应结果</h4>
        <pre id="responseBody"></pre>
      </div>
    </div>
  </div>
</div>

<script>
let token = localStorage.getItem('bookstore_token') || ''
if (token) document.getElementById('reqToken').value = 'Bearer ' + token

fetch('/health').then(r => r.json()).then(d => {
  document.getElementById('healthStatus').textContent = d.code === 0 ? '运行中' : '异常'
})
document.getElementById('apiCount').textContent = document.querySelectorAll('.api-item').length

function tryApi(btn) {
  const item = btn.closest('.api-item')
  const method = item.dataset.method
  const path = item.dataset.path
  const body = item.dataset.body || ''
  document.getElementById('reqMethod').value = method
  document.getElementById('reqPath').value = path
  const bodyField = document.getElementById('bodyField')
  const bodyInput = document.getElementById('reqBody')
  if (body) { bodyField.style.display = 'block'; bodyInput.value = JSON.stringify(JSON.parse(body), null, 2) }
  else { bodyField.style.display = 'none'; bodyInput.value = '' }
  document.getElementById('responseArea').style.display = 'none'
  document.getElementById('modal').classList.add('active')
}

function closeModal() { document.getElementById('modal').classList.remove('active') }
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal() })

async function sendRequest() {
  const method = document.getElementById('reqMethod').value
  let path = document.getElementById('reqPath').value
  const tokenVal = document.getElementById('reqToken').value
  const bodyVal = document.getElementById('reqBody').value
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (tokenVal) opts.headers.Authorization = tokenVal
  if (bodyVal && method !== 'GET') opts.body = bodyVal
  try {
    const res = await fetch(path, opts)
    const data = await res.json()
    document.getElementById('responseBody').textContent = JSON.stringify(data, null, 2)
    document.getElementById('responseArea').style.display = 'block'
    if (data.data && data.data.token) {
      token = data.data.token
      localStorage.setItem('bookstore_token', token)
      document.getElementById('reqToken').value = 'Bearer ' + token
    }
  } catch (err) {
    document.getElementById('responseBody').textContent = '请求失败: ' + err.message
    document.getElementById('responseArea').style.display = 'block'
  }
}
</script>
</body>
</html>`)
})

// 异步启动
async function start() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`)
  })
}

start()
