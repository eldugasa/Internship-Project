import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const root = path.join(new URL(import.meta.url).pathname, '..', '..')
// normalize path for Windows
const projectRoot = process.platform === 'win32' ? root.replace(/^\//, '') : root
const prismaBin = path.join(projectRoot, 'node_modules', '.bin', 'prisma')

function runPrisma() {
  const res = spawnSync(prismaBin, ['generate'], { stdio: 'inherit' })
  return res
}

try {
  let res = runPrisma()
  if (res.error && res.error.code === 'EACCES') {
    try {
      fs.chmodSync(prismaBin, 0o755)
    } catch (e) {
      // continue to try running; chmod may fail on some filesystems
    }
    res = runPrisma()
  }
  if (res.status !== 0) process.exit(res.status || 1)
} catch (e) {
  console.error(e)
  process.exit(1)
}
