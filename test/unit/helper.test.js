/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import App from '../../class/app.js'
import Bajo from '../../class/bajo.js'
import Base from '../../class/base.js'
import {
  outmatchNs,
  parseObject,
  lib,
  ask,
  buildBaseConfig,
  buildPlugins,
  collectConfigHandlers,
  buildConfig,
  bootOrder,
  checkNameAliases,
  checkDependencies,
  collectHooks,
  runPlugins,
  exitHandler,
  importModule,
  freeze,
  deepFreeze,
  findDeep,
  types,
  formats
} from '../../lib/helper.js'

describe('helper module (unit)', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-helper-unit-'))
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('outmatchNs, parseObject, lib, importModule, freeze/deepFreeze/findDeep/types/formats', async () => {
    const ctx = { bajo: { breakNsPath: (v) => { const [fullNs, p] = v.split(':'); return { fullNs, path: p } } } }
    expect(outmatchNs.call(ctx, 'a:x/y', 'a:x/*')).to.equal(true)

    const pct = { bajo: { t: (txt) => txt } }
    const po = parseObject.call(pct, { 't:name': 'hello' })
    expect(po.name).to.equal('hello')

    expect(lib._).to.be.an('function')

    const f = path.join(root, 'mod.js')
    await fs.writeFile(f, 'export default { ok: true }', 'utf8')
    const m = await importModule(f)
    expect(m.ok).to.equal(true)

    const obj = { a: { b: 1 } }
    freeze(obj)
    expect(Object.isFrozen(obj)).to.equal(true)
    const obj2 = deepFreeze({ m: new Map() }, true)
    expect(Object.isFrozen(obj2)).to.equal(true)

    const d = path.join(root, 'x')
    await fs.ensureDir(d)
    await fs.writeFile(path.join(d, 'needle.txt'), 'x', 'utf8')
    expect(findDeep('needle.txt', [d])).to.equal(path.join(d, 'needle.txt'))

    expect(types).to.include('speed')
    expect(formats.metric.speedUnit).to.equal('kmh')
  })

  it('ask export is available', () => {
    expect(typeof ask).to.equal('function')
  })

  it('boot lifecycle exports are callable with real app context', async function () {
    this.timeout(10000)
    await fs.writeJson(path.join(root, 'package.json'), { name: 'helper-app', type: 'module', bajo: { plugins: [] } })
    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'data', 'config', 'bajo.json'), { env: 'dev', log: { level: 'silent', save: false }, exitHandler: false, cache: { purgeIntvDur: '1h' } })

    const app = new App({ cwd: root })
    const bajo = new Bajo(app)
    app.bajo = bajo
    app.main = new Base('main', app)
    app.main.config = {}
    app.main.dir = { pkg: path.join(root, 'main') }
    app.main.intl = { 'en-US': { or: 'or' } }
    app.getAllNs = () => []
    app.pluginPkgs = []
    app.configHandlers = [
      { ns: 'bajo', ext: '.js', readHandler: bajo.fromJs },
      { ns: 'bajo', ext: '.json', readHandler: bajo.fromJson, writeHandler: bajo.toJson },
      { ns: 'bajo', ext: '.yaml', readHandler: bajo.fromYaml, writeHandler: bajo.toYaml },
      { ns: 'bajo', ext: '.yml', readHandler: bajo.fromYml, writeHandler: bajo.toYml }
    ]

    bajo.log = { trace: () => {}, debug: () => {}, warn: () => {}, error: () => {} }
    bajo.print = { info: () => {}, fatal: () => {} }
    bajo.hooks = []

    await buildBaseConfig.call(bajo)
    await collectConfigHandlers.call(bajo)
    await buildConfig.call(bajo)
    await bootOrder.call(bajo)
    await checkNameAliases.call(bajo)
    await checkDependencies.call(bajo)
    await collectHooks.call(bajo)
    await runPlugins.call(bajo)
    await exitHandler.call(bajo)

    delete app.main
    await buildPlugins.call(bajo)
  })
})
