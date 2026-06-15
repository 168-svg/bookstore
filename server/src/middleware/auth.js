import process from 'node:process'
import { Buffer } from 'node:buffer'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

const SCRYPT_KEYLEN = 64
const SALT_LENGTH = 16

export function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
    return `${salt}:${derivedKey}`
}

export function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) {
        return false
    }
    const [salt, key] = storedHash.split(':')
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(derivedKey))
}

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

export function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, msg: '无管理员权限' })
    }
    next()
}