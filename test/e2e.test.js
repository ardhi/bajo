/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { expect } from 'chai'
import fs from 'fs-extra'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-e2e-test-'))

const runNode = (cwd, file, timeoutMs = 8000) => {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      resolve({ code: null, stdout, stderr, timedOut: true })
    }, timeoutMs)
    child.on('close', code => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr, timedOut: false })
    })
  })
}

describe('E2E', () => {
  let rootDir

  beforeEach(() => {
    rootDir = createTempRoot()
  })

  afterEach(() => {
    if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true })
  })

  it('boots a real app in a separate process and runs a real plugin end to end', async function () {
    this.timeout(12000)
    const packageEntry = pathToFileURL(path.join('/mnt/d/Projects/Bajo/bajo', 'index.js')).href
    const pluginName = 'demo-e2e-plugin'
    const pluginDir = path.join(rootDir, 'node_modules', pluginName)
    const appMainDir = path.join(rootDir, 'main')
    const outputFile = path.join(rootDir, 'e2e-output.txt')

    await fs.ensureDir(pluginDir)
    await fs.ensureDir(appMainDir)

    await fs.writeJson(path.join(rootDir, 'package.json'), {
      name: 'bajo-e2e-app',
      type: 'module',
      bajo: {
        plugins: [pluginName]
      }
    })

    await fs.writeJson(path.join(pluginDir, 'package.json'), {
      name: pluginName,
      version: '1.0.0',
      type: 'module',
      main: 'index.js'
    })

    await fs.writeFile(path.join(pluginDir, 'index.js'), `
async function factory (pkgName) {
  const me = this

  return class E2ePlugin extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
      this.start = async () => {
        await this.app.lib.fs.writeFile(this.app.dir + '/e2e-output.txt', 'started:' + this.ns, 'utf8')
      }
    }
  }
}

export default factory
`, 'utf8')

    await fs.writeFile(path.join(appMainDir, 'index.js'), `
async function factory (pkgName) {
  const me = this

  return class Main extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
      this.start = async () => {
        console.log('MAIN_STARTED')
      }
    }
  }
}

export default factory
`, 'utf8')

    await fs.ensureDir(path.join(rootDir, 'data', 'config'))
    await fs.writeJson(path.join(rootDir, 'data', 'config', 'bajo.json'), {
      log: { level: 'silent', save: false },
      exitHandler: false,
      cache: { purgeIntvDur: '1h' }
    })

    await fs.writeFile(path.join(rootDir, 'run-app.js'), `
import boot from ${JSON.stringify(packageEntry)}

const app = await boot({ cwd: process.cwd() })
console.log('BOOT_OK:' + !!app.getPlugin(${JSON.stringify(pluginName)}, true))
process.exit(0)
`, 'utf8')

    const result = await runNode(rootDir, 'run-app.js')

    expect(result.timedOut).to.equal(false)
    expect(result.code).to.equal(0)
    expect(result.stderr).to.equal('')
    expect(result.stdout).to.include('MAIN_STARTED')
    expect(result.stdout).to.include('BOOT_OK:true')
    expect(fs.existsSync(outputFile)).to.equal(true)
    expect(fs.readFileSync(outputFile, 'utf8')).to.match(/^started:/)
  })
})
