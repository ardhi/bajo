import { spawn } from 'node:child_process'

export const runNode = (cwd, file, timeoutMs = 15000) => {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', c => { stdout += c.toString() })
    child.stderr.on('data', c => { stderr += c.toString() })
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      resolve({ code: null, timedOut: true, stdout, stderr })
    }, timeoutMs)
    child.on('close', code => {
      clearTimeout(timer)
      resolve({ code, timedOut: false, stdout, stderr })
    })
  })
}
