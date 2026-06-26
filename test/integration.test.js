/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'

import App from '../class/app.js'
import Bajo from '../class/bajo.js'
import Base from '../class/base.js'
import Plugin from '../class/plugin.js'
import Log from '../class/log.js'
import boot from '../index.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-integration-test-'))

const cleanupNewProcessListeners = (beforeCounts) => {
  const events = Object.keys(beforeCounts)
  for (const event of events) {
    const listeners = process.listeners(event)
    const keep = beforeCounts[event]
    if (listeners.length <= keep) continue
    for (const listener of listeners.slice(keep)) {
      process.removeListener(event, listener)
    }
  }
}

describe('Integration', () => {
  let rootDir

  beforeEach(async () => {
    rootDir = createTempRoot()
    await fs.writeJson(path.join(rootDir, 'package.json'), {
      name: 'bajo-integration-app',
      type: 'module'
    })
  })

  afterEach(() => {
    if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true })
  })

  it('integrates App + Bajo + Plugin with real package info and ns-path file resolution', async () => {
    const app = new App({ cwd: rootDir })
    const bajo = new Bajo(app)
    app.bajo = bajo
    bajo.dir = {
      base: rootDir,
      data: path.join(rootDir, 'data')
    }
    await fs.ensureDir(bajo.dir.data)

    const pluginDir = path.join(rootDir, 'plugins', 'demo-plugin')
    await fs.ensureDir(pluginDir)
    await fs.writeJson(path.join(pluginDir, 'package.json'), {
      name: 'demo-plugin',
      version: '1.0.0',
      description: 'integration plugin'
    })

    const plugin = new Plugin('demo-plugin', app)
    plugin.dir = { pkg: pluginDir }
    app.addPlugin(plugin)
    app.pluginPkgs = ['demo-plugin']

    expect(plugin.getPkgInfo()).to.deep.equal({
      name: 'demo-plugin',
      version: '1.0.0',
      description: 'integration plugin'
    })

    const dataDir = app.getPluginDataDir('demoPlugin')
    expect(fs.existsSync(dataDir)).to.equal(true)

    const resolved = app.getPluginFile('demoPlugin:/src/index.js')
    expect(resolved).to.equal(path.join(pluginDir, 'src/index.js'))
  })

  it('integrates Base.loadConfig with real config files', async () => {
    const app = new App({ cwd: rootDir })
    const bajo = new Bajo(app)
    app.bajo = bajo
    app.pluginPkgs = ['main']

    bajo.dir = {
      base: rootDir,
      data: path.join(rootDir, 'data')
    }
    bajo.config = { env: 'dev' }
    await fs.ensureDir(path.join(bajo.dir.data, 'config'))
    bajo.config.log = {
      level: 'silent',
      save: false,
      pretty: false,
      useUtc: false,
      timeTaken: false,
      dateFormat: 'YYYY-MM-DD',
      rotation: { cycle: 'none', byPlugin: false }
    }
    app.log = new Log(app)
    await fs.writeJson(path.join(bajo.dir.data, 'config', 'main.json'), {
      title: 'Integration Main',
      main: {
        feature: true,
        port: 7000
      }
    })

    const main = new Base('main', app)
    main.config = {
      main: {
        feature: false,
        port: 3000
      }
    }
    app.addPlugin(main)

    await main.loadConfig()

    expect(main.getConfig('main.feature')).to.equal(true)
    expect(main.getConfig('main.port')).to.equal(7000)
    expect(main.getConfig('title')).to.equal('Integration Main')
    expect(main.dir.pkg).to.equal(path.join(rootDir, 'main'))
    expect(main.dir.data).to.equal(path.join(bajo.dir.data, 'plugins', 'main'))
  })

  it('integrates App cache save/load using Bajo ns parser and filesystem cache', async () => {
    const app = new App({ cwd: rootDir })
    const bajo = new Bajo(app)
    app.bajo = bajo
    bajo.dir = {
      base: rootDir,
      data: path.join(rootDir, 'data')
    }
    await fs.ensureDir(bajo.dir.data)

    const content = { ok: true, items: [1, 2, 3] }
    await app.cache.save('bajo.api:items/list', content, 60000)
    const loaded = await app.cache.load('bajo.api:items/list', 60000)

    expect(loaded).to.deep.equal(content)
  })

  it('integrates real full boot flow through index entry with disk plugin', async () => {
    const pluginName = 'integration-plugin'
    const pluginDir = path.join(rootDir, 'node_modules', pluginName)
    await fs.ensureDir(pluginDir)
    await fs.writeJson(path.join(rootDir, 'package.json'), {
      name: 'bajo-integration-app',
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

  return class IntegrationPlugin extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = { started: false }
      this.start = async () => {
        this.state.started = true
        const dir = this.app.getPluginDataDir(this.ns)
        this.app.lib.fs.writeFileSync(dir + '/started.txt', 'ok', 'utf8')
      }
    }
  }
}

export default factory
`, 'utf8')

    const dataDir = path.join(rootDir, 'data', 'config')
    await fs.ensureDir(dataDir)
    await fs.writeJson(path.join(dataDir, 'bajo.json'), {
      log: { level: 'silent', save: false },
      exitHandler: false,
      cache: { purgeIntvDur: '1h' }
    })

    const events = ['SIGINT', 'SIGTERM', 'beforeExit', 'uncaughtException', 'unhandledRejection', 'warning']
    const beforeCounts = events.reduce((acc, event) => {
      acc[event] = process.listeners(event).length
      return acc
    }, {})

    const originalSetInterval = global.setInterval
    const createdIntervals = []
    global.setInterval = (fn, delay, ...args) => {
      const id = originalSetInterval(fn, delay, ...args)
      createdIntervals.push(id)
      return id
    }

    const app = await boot({ cwd: rootDir })

    try {
      expect(app).to.be.an('object')
      expect(app.integrationPlugin).to.be.an('object')
      const startedFile = path.join(rootDir, 'data', 'plugins', 'integrationPlugin', 'started.txt')
      expect(fs.existsSync(startedFile)).to.equal(true)
      expect(fs.readFileSync(startedFile, 'utf8')).to.equal('ok')
    } finally {
      global.setInterval = originalSetInterval
      for (const id of createdIntervals) clearInterval(id)
      cleanupNewProcessListeners(beforeCounts)
    }
  })
})
