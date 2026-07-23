/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import App from '../../class/app.js'
import Plugin from '../../class/plugin.js'

describe('app (unit)', () => {
  let root
  let app

  beforeEach(() => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-app-unit-'))
    app = new App({ cwd: root })
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('addPlugin and getAllNs/getPlugins/getAllPlugins work', () => {
    const p = new Plugin('x-plugin', app)
    app.addPlugin(p)
    app.pluginPkgs = ['x-plugin']
    expect(app.getAllNs()).to.deep.equal(['xPlugin'])
    expect(app.getPlugins()).to.deep.equal([p])
    expect(app.getAllPlugins()).to.deep.equal([p])
  })

  it('getPlugin resolves by ns, alias and package name', () => {
    const p = new Plugin('x-plugin', app)
    p.alias = 'xp'
    app.addPlugin(p)
    app.bajo = { error: (msg, v) => new Error(`${msg}:${v}`) }
    expect(app.getPlugin('xPlugin')).to.equal(p)
    expect(app.getPlugin('xp')).to.equal(p)
    expect(app.getPlugin('x-plugin')).to.equal(p)
  })

  it('getPlugin supports silent misses and throws on non-silent miss', () => {
    app.bajo = { error: (msg, v) => new Error(`${msg}:${v}`) }
    expect(app.getPlugin('none', true)).to.equal(undefined)
    expect(() => app.getPlugin('none')).to.throw()
  })

  it('getPluginDataDir creates plugin data folder', () => {
    const p = new Plugin('x-plugin', app)
    app.addPlugin(p)
    app.bajo = { dir: { data: path.join(root, 'data') }, error: () => new Error('x') }
    const d = app.getPluginDataDir('xPlugin')
    expect(fs.existsSync(d)).to.equal(true)
  })

  it('getPluginFile resolves scoped plugin paths', async () => {
    const p = new Plugin('x-plugin', app)
    p.dir = { pkg: path.join(root, 'plugins', 'x-plugin') }
    await fs.ensureDir(p.dir.pkg)
    app.addPlugin(p)
    app.bajo = { breakNsPath: () => ({ ns: 'xPlugin', path: '/a/b.js' }) }
    const f = app.getPluginFile('xPlugin:/a/b.js')
    expect(f).to.equal(path.join(p.dir.pkg, 'a/b.js'))
  })

  it('dump works in both plain and boxen modes', () => {
    app.bajo = { config: { dump: { depth: 1, compact: true, colors: false, breakLength: 80, caller: false, frame: {} } } }
    app.dump({ a: 1 })
    app.boxen = (text) => text
    app.dump({ b: 2 })
  })

  it('exit handles signal and hard exit', () => {
    const oldKill = process.kill
    const oldExit = process.exit
    const calls = []
    let ex
    process.kill = (...args) => { calls.push(args); return true }
    process.exit = (arg) => { ex = arg; throw new Error('__EXIT__') }
    try {
      app.exit('SIGTERM')
      try { app.exit(true) } catch (err) {}
    } finally {
      process.kill = oldKill
      process.exit = oldExit
    }
    expect(calls[0][1]).to.equal('SIGTERM')
    expect(ex).to.equal('1')
  })

  it('loadIntl/t/te/getConfigFormats/startPlugin/stopPlugin work', async () => {
    const p = new Plugin('x-plugin', app)
    p.dir = { pkg: path.join(root, 'plugins', 'x-plugin') }
    await fs.ensureDir(path.join(p.dir.pkg, 'extend', 'bajo', 'intl'))
    await fs.writeJson(path.join(p.dir.pkg, 'extend', 'bajo', 'intl', 'en.json'), { hi: 'Hi %s' })
    p.start = () => {}
    app.addPlugin(p)
    app.pluginPkgs = ['x-plugin']
    app.bajo = {
      config: { lang: 'en', intl: { supported: ['en'], fallback: 'en' }, log: { level: 'silent' } },
      join: (a) => a.join(', '),
      log: { warn: () => {} }
    }
    app.configHandlers = [{ ext: '.json' }, { ext: '.yml' }]

    app.loadIntl('xPlugin')
    expect(app.xPlugin.intl.en.hi).to.equal('Hi %s')
    expect(app.t('xPlugin', 'hi', 'Joe')).to.equal('Hi Joe')
    expect(app.te('xPlugin', 'hi')).to.equal(true)
    expect(app.getConfigFormats()).to.deep.equal(['.json', '.yml'])
    expect(app.getConfigFormats(true)).to.deep.equal(['json', 'yml'])

    app.startPlugin('xPlugin', 'a')
    app.stopPlugin('xPlugin', 'a')
  })
})
