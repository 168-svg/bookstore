import jwt from 'jsonwebtoken'

const JWT_SECRET = 'bookstore-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Express 中间件：验证 JWT
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未登录或token已过期' })
  }

  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ code: 401, msg: 'token无效或已过期' })
  }

  req.user = decoded
  next()
}

// Express 中间件：验证管理员权限
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, msg: '无管理员权限' })
  }
  next()
}
