import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd())
const serverDir = path.join(rootDir, 'server')
const distDir = path.join(rootDir, 'dist', 'build', 'h5')
const publicDir = path.join(serverDir, 'public')

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || rootDir, env: { ...process.env, ...(opts.env || {}) } })
}

console.log('========================================')
console.log('  Railway 构建流程')
console.log('========================================')

try {
  // 1. 安装前端依赖（根目录已有 pnpm/npm 依赖）
  // 2. 安装 server 依赖
  if (fs.existsSync(path.join(serverDir, 'package.json'))) {
    run('pnpm install --prod --no-optional', { cwd: serverDir })
  }

  // 3. 构建 uni-app H5
  if (fs.existsSync(path.join(rootDir, 'vite.config.ts'))) {
    console.log('\n📦 构建 H5 前端 (uni build)...')
    run('pnpm run build:h5', { env: { NODE_ENV: 'production', UNI_PLATFORM: 'h5' } })

    // 4. 将 H5 构建产物拷贝到 server/public（Express 静态资源目录）
    if (fs.existsSync(distDir)) {
      // 清理旧的 public 目录
      if (fs.existsSync(publicDir)) {
        fs.rmSync(publicDir, { recursive: true, force: true })
      }
      // 拷贝构建产物
      copyDir(distDir, publicDir)
      console.log(`\n✅ H5 构建产物已拷贝到 server/public (${countFiles(publicDir)} 个文件)`)
    }
    else {
      console.log('⚠️  H5 构建产物目录不存在: dist/build/h5')
    }
  }
  else {
    console.log('⚠️  未找到 vite.config.ts，跳过 H5 前端构建')
  }

  console.log('\n========================================')
  console.log('  构建完成 ✅')
  console.log('========================================')
}
catch (error) {
  console.error('\n❌ 构建失败:', error.message)
  console.error('\n详细错误:', error.stderr?.toString() || error.stdout?.toString() || error.stack)
  process.exit(1)
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    }
    else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function countFiles(dir) {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name))
    }
    else {
      count++
    }
  }
  return count
}
