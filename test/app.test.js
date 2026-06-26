/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'

import App from '../class/app.js'
import Plugin from '../class/plugin.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-app-test-'))

describe('App', () => {
  let rootDir
  let app

  beforeEach(() => {
    rootDir = createTempRoot()
    app = new App({ cwd: rootDir })
  })

  afterEach(() => {
    if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true })
  })

  it('adds plugins and base class mappings', () => {
    const plugin = new Plugin('my-plugin', app)
    const MyBase = class {}

    app.addPlugin(plugin, MyBase)

    expect(app.myPlugin).to.equal(plugin)
    expect(app.baseClass.MyPlugin).to.equal(MyBase)
  })

  it('throws when adding the same plugin namespace twice', () => {
    const plugin = new Plugin('dup-plugin', app)
    app.addPlugin(plugin)

    expect(() => app.addPlugin(plugin)).to.throw("Plugin 'dupPlugin' added already")
  })

  it('lists namespaces and loaded plugins', () => {
    app.pluginPkgs = ['alpha-plugin', 'beta-plugin']
    app.alphaPlugin = { ns: 'alphaPlugin' }
    app.betaPlugin = { ns: 'betaPlugin' }

    expect(app.getAllNs()).to.deep.equal(['alphaPlugin', 'betaPlugin'])
    expect(app.getPlugins()).to.deep.equal([app.alphaPlugin, app.betaPlugin])
    expect(app.getPlugins(['betaPlugin'])).to.deep.equal([app.betaPlugin])
    expect(app.getAllPlugins()).to.deep.equal([app.alphaPlugin, app.betaPlugin])
  })

  it('gets plugin by namespace, alias, and package name', () => {
    const plugin = new Plugin('my-plugin', app)
    plugin.alias = 'mine'
    app.addPlugin(plugin)
    app.bajo = { error: (code, value) => new Error(`${code}:${value}`) }

    expect(app.getPlugin('myPlugin')).to.equal(plugin)
    expect(app.getPlugin('mine')).to.equal(plugin)
    expect(app.getPlugin('my-plugin')).to.equal(plugin)
  })

  it('supports silent and throwing behavior for missing plugin lookup', () => {
    app.bajo = { error: (code, value) => new Error(`${code}:${value}`) }

    expect(app.getPlugin('missing', true)).to.equal(false)
    expect(() => app.getPlugin('missing')).to.throw('pluginWithNameAliasNotLoaded%s:missing')
  })

  it('creates and returns plugin data directory', () => {
    const plugin = new Plugin('my-plugin', app)
    app.addPlugin(plugin)
    app.bajo = { dir: { data: path.join(rootDir, 'data') } }

    const dir = app.getPluginDataDir('myPlugin')

    expect(dir).to.equal(path.join(rootDir, 'data', 'plugins', 'myPlugin'))
    expect(fs.existsSync(dir)).to.equal(true)
  })

  it('resolves plugin-scoped files and node_modules fallback paths', async () => {
    const plugin = new Plugin('my-plugin', app)
    plugin.dir = { pkg: path.join(rootDir, 'plugins', 'my-plugin') }
    await fs.ensureDir(plugin.dir.pkg)
    app.addPlugin(plugin)

    app.bajo = {
      breakNsPath: () => ({ ns: 'myPlugin', path: '/src/feature.js' })
    }
    expect(app.getPluginFile('myPlugin:/src/feature.js')).to.equal(path.join(plugin.dir.pkg, 'src/feature.js'))

    const fallbackFile = path.join(rootDir, 'plugins', 'dep', 'index.js')
    await fs.ensureDir(path.dirname(fallbackFile))
    await fs.writeFile(fallbackFile, 'export default 1', 'utf8')
    app.bajo.breakNsPath = () => ({ ns: 'myPlugin', path: 'node_modules/dep/index.js' })

    expect(app.getPluginFile('myPlugin:node_modules/dep/index.js')).to.equal(`${plugin.dir.pkg}/../dep/index.js`)
  })

  it('translates and checks translation existence', () => {
    app.pluginPkgs = ['my-plugin']
    app.myPlugin = {
      intl: {
        id: {
          greet: 'Halo %s',
          list: 'Daftar: %s'
        },
        en: {
          greet: 'Hello %s'
        }
      }
    }
    app.bajo = {
      config: {
        lang: 'id',
        intl: {
          fallback: 'en',
          supported: ['id', 'en']
        }
      },
      join: (items) => items.join(', '),
      log: { warn: () => {} }
    }

    expect(app.t('myPlugin', 'greet', 'Ardhi')).to.equal('Halo Ardhi')
    expect(app.t('myPlugin', 'list', ['A', 'B'])).to.equal('Daftar: A, B')
    expect(app.t('myPlugin', 'unknown %s', 'X')).to.equal('unknown X')
    expect(app.te('myPlugin', 'greet')).to.equal(true)
    expect(app.te('myPlugin', 'not.exists')).to.equal(false)
  })

  it('returns supported config formats', () => {
    app.configHandlers = [{ ext: '.json' }, { ext: '.yaml' }]

    expect(app.getConfigFormats()).to.deep.equal(['.json', '.yaml'])
  })

  it('starts plugin by namespace with arguments', () => {
    const calls = []
    app.sample = {
      start: (...args) => {
        calls.push(args)
      }
    }

    app.startPlugin('sample', 1, 'x')

    expect(calls).to.deep.equal([[1, 'x']])
  })

  it('kills process with signal and exits abruptly when true is passed', () => {
    const originalKill = process.kill
    const originalExit = process.exit
    const killCalls = []
    let exitArg

    process.kill = (...args) => {
      killCalls.push(args)
      return true
    }
    process.exit = (arg) => {
      exitArg = arg
      throw new Error('__EXIT__')
    }

    try {
      app.exit('SIGTERM')
      try {
        app.exit(true)
      } catch (err) {
        if (err.message !== '__EXIT__') throw err
      }
    } finally {
      process.kill = originalKill
      process.exit = originalExit
    }

    expect(killCalls).to.deep.equal([[process.pid, 'SIGTERM']])
    expect(exitArg).to.equal('1')
  })
})
