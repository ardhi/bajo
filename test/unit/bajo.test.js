/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import lodash from 'lodash'
import { expect } from 'chai'
import App from '../../class/app.js'
import Bajo from '../../class/bajo.js'
import Base from '../../class/base.js'

describe('bajo (unit)', () => {
  let root
  let app
  let bajo

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-bajo-unit-'))
    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'package.json'), { name: 'app', type: 'module' })
    app = new App({ cwd: root })
    app.lib._ = lodash
    bajo = new Bajo(app)
    app.bajo = bajo
    bajo.dir = { base: root, pkg: root, data: path.join(root, 'data') }
    bajo.config = {
      env: 'dev',
      lang: 'en-US',
      intl: { supported: ['en-US'], fallback: 'en-US', unitSys: { 'en-US': 'metric' }, format: { emptyValue: '', integer: {}, float: {}, double: {}, datetime: {}, date: {}, time: {} } },
      log: { level: 'trace', save: false, pretty: false, useUtc: false, timeTaken: false, dateFormat: 'YYYY-MM-DD', rotation: { cycle: 'none', byPlugin: false } },
      cache: { purgeIntvDur: '1h', purge: [] },
      exitHandler: false
    }
    app.main = new Base('main', app)
    app.main.config = {}
    app.main.dir = { pkg: path.join(root, 'main') }
    app.main.intl = { 'en-US': { and: 'and', none: 'none', true: 'true', false: 'false', or: 'or' } }
    app.getAllNs = () => ['main']
    app.pluginPkgs = ['main']
    app.configHandlers = [
      { ns: 'bajo', ext: '.json', readHandler: bajo.fromJson, writeHandler: bajo.toJson },
      { ns: 'bajo', ext: '.yaml', readHandler: bajo.fromYaml, writeHandler: bajo.toYaml },
      { ns: 'bajo', ext: '.yml', readHandler: bajo.fromYml, writeHandler: bajo.toYml }
    ]
    bajo.hooks = []
    bajo.log = { trace: () => {}, debug: () => {}, warn: () => {}, error: () => {} }
    bajo.print = { info: () => {}, fatal: () => {}, succeed: () => {} }
    app.log = { trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, silent: () => {} }
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('ns path helpers and format helpers work', () => {
    const a = bajo.breakNsPathFromFile({ file: '/x/y/demo-plugin@task-run.js', dir: '/x/y/', ns: 'demo-plugin' })
    expect(a.ns).to.equal('demoPlugin')
    expect(bajo.buildNsPath({ ns: 'a', subNs: 'b', subSubNs: 'c', path: 'p' })).to.equal('a.b.c:p')
    const b = bajo.breakNsPath('main:hello/:id|2?q=1', false)
    expect(b.params.id).to.equal('2')
    const f = bajo.getUnitFormat({ type: 'speed', lang: 'en-US' })
    expect(f.format.speedUnit).to.equal('kmh')
    expect(bajo.formatByField('speed', 100, 'float', { withUnit: true, lang: 'en-US' })).to.include('kmh')
    expect(bajo.format('x', 'string')).to.equal('x')
  })

  it('getMethod/getModuleDir/importModule/importPkg/isLogInRange validators work', async () => {
    app.main.work = () => 'ok'
    expect(bajo.getMethod('main:work')()).to.equal('ok')
    expect(bajo.getModuleDir('main')).to.equal(app.dir)

    const f = path.join(root, 'm.js')
    await fs.writeFile(f, 'export default { ok: true }', 'utf8')
    const m = await bajo.importModule(f)
    expect(m.ok).to.equal(true)

    const pkg = await bajo.importPkg('bajo:lodash')
    expect(['function', 'object']).to.include(typeof pkg)

    expect(bajo.isLogInRange('trace')).to.equal(true)

    expect(bajo.isValidAppPlugin({ bajo: { type: 'app' } }, 'app')).to.equal(true)
    expect(bajo.isValidAppPlugin({ bajo: { type: 'plugin' } }, 'plugin')).to.equal(true)
    expect(bajo.isValidApp(root)).to.equal(false)
    expect(bajo.isValidPlugin(root)).to.equal(false)
  })

  it('join/numUnit/config readers-writers/hooks/download/parser work', async () => {
    expect(bajo.join(['a', 'b'], { lang: 'en-US' })).to.equal('a and b')
    expect(bajo.numUnit('120km', 'm')).to.equal('120km')

    expect(await bajo.fromJson('{"a":1}')).to.deep.equal({ a: 1 })
    expect(await bajo.fromYaml('a: 1\n')).to.deep.equal({ a: 1 })
    expect(await bajo.fromYml('a: 1\n')).to.deep.equal({ a: 1 })

    const jf = path.join(root, 'a.json')
    await bajo.toJson({ a: 1 }, { writeToFile: jf })
    expect(fs.existsSync(jf)).to.equal(true)
    const yf = path.join(root, 'a.yml')
    await bajo.toYaml({ a: 1 }, { writeToFile: yf })
    expect(fs.existsSync(yf)).to.equal(true)
    const y2f = path.join(root, 'b.yml')
    await bajo.toYml({ a: 1 }, { writeToFile: y2f })
    expect(fs.existsSync(y2f)).to.equal(true)

    const cf = path.join(root, 'data', 'config', 'x.json')
    await fs.writeJson(cf, { x: 1 })
    const rc = await bajo.readConfig(path.join(root, 'data', 'config', 'x.*'), { ignoreError: false })
    expect(rc).to.deep.equal({ x: 1 })

    await fs.writeJson(path.join(root, 'data', 'config', 'y.json'), { y: 1 })
    await fs.writeJson(path.join(root, 'data', 'config', 'y-dev.json'), { y: 2 })
    const all = await bajo.readAllConfigs(path.join(root, 'data', 'config', 'y'))
    expect(all.y).to.equal(2)

    bajo.hooks = [{ name: 'h:run', src: 'main', level: 1, handler: async (v) => v + 1 }]
    const h = await bajo.runHook('h:run', 1)
    expect(h[0].resp).to.equal(2)

    const d = bajo.getDownloadDir()
    expect(fs.existsSync(d)).to.equal(true)
    const saved = await bajo.saveAsDownload('file.txt', 'abc', false)
    expect(fs.existsSync(saved)).to.equal(true)

    const p = await bajo.parseConfig('{"x":1}', ['.json'])
    expect(p).to.deep.equal({ x: 1 })
  })

  it('buildCollections/callHandler/eachPlugins paths are callable', async () => {
    app.main.getConfig = () => ({ items: [{ name: 'n1' }] })
    app.main.log = { trace: () => {}, debug: () => {}, fatal: () => {} }
    bajo.runHook = async () => []
    const c = await bajo.buildCollections({ ns: 'main', container: 'items', handler: ({ item }) => item })
    expect(c).to.have.length(1)

    app.main.work = async (x) => x + 1
    expect(await bajo.callHandler('main:work', 1)).to.equal(2)
    expect(await bajo.callHandler(async function (x) { return x + 2 }, 1)).to.equal(3)
    expect(await bajo.callHandler({ handler: async function (x) { return x + 3 } }, 1)).to.equal(4)

    const pdir = path.join(root, 'node_modules', 'fake-plugin')
    await fs.ensureDir(path.join(pdir, 'hook'))
    await fs.writeJson(path.join(pdir, 'package.json'), { name: 'fake-plugin', version: '1.0.0', type: 'module', main: 'index.js' })
    await fs.writeFile(path.join(pdir, 'index.js'), 'export default async function factory (pkgName) { const me = this; return class P extends this.app.baseClass.Base { constructor () { super(pkgName, me.app); this.config = {} } } }', 'utf8')
    await fs.writeFile(path.join(pdir, 'hook', 'x@y.js'), 'export default async function () { return true }', 'utf8')
    app.pluginPkgs = ['fake-plugin']
    app.fakePlugin = new Base('fake-plugin', app)
    app.fakePlugin.dir = { pkg: pdir }
    const e = await bajo.eachPlugins(async ({ file }) => file, { glob: 'hook/*.js', returnItems: true })
    expect(e).to.be.an('array')
  })
})
