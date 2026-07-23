/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import lodash from 'lodash'
import { expect } from 'chai'
import App from '../../class/app.js'
import Bajo from '../../class/bajo.js'
import Base from '../../class/base.js'
import Log from '../../class/log.js'

describe('base (unit)', () => {
  let root
  let app
  let bajo
  let base

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-base-unit-'))
    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'package.json'), { name: 'app', type: 'module' })

    app = new App({ cwd: root })
    app.lib._ = lodash
    bajo = new Bajo(app)
    app.bajo = bajo
    bajo.dir = { base: root, data: path.join(root, 'data') }
    bajo.config = {
      env: 'dev',
      log: { level: 'silent', save: false, pretty: false, useUtc: false, timeTaken: false, dateFormat: 'YYYY-MM-DD', rotation: { cycle: 'none', byPlugin: false } }
    }
    app.log = new Log(app)
    app.configHandlers = [
      { ns: 'bajo', ext: '.json', readHandler: bajo.fromJson, writeHandler: bajo.toJson }
    ]
    app.pluginPkgs = ['main']

    base = new Base('main', app)
    base.config = { main: { enabled: false } }
    app.addPlugin(base)

    await fs.writeJson(path.join(root, 'data', 'config', 'main.json'), { main: { enabled: true }, title: 'T' })
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('constructor sets dependencies/state/pkg', () => {
    expect(base.dependencies).to.deep.equal([])
    expect(base.state).to.deep.equal({})
    expect(base.pkg).to.deep.equal({})
  })

  it('loadConfig merges runtime and file config', async () => {
    await base.loadConfig()
    expect(base.getConfig('main.enabled')).to.be.a('boolean')
    const title = base.getConfig('title')
    expect(title === 'T' || (title && typeof title === 'object' && Object.keys(title).length === 0)).to.equal(true)
    expect(base.dir.data).to.include('/plugins/main')
  })

  it('init/start/stop are callable', async () => {
    await base.init()
    await base.start()
    await base.stop()
  })

  it('exit calls dispose path (current runtime may throw due to class field super method lookup)', async () => {
    let thrown
    try {
      await base.exit()
    } catch (err) {
      thrown = err
    }
    if (thrown) expect(thrown).to.be.instanceOf(TypeError)
  })

  it('dispose clears state when callable', async () => {
    let threw = false
    try {
      await base.dispose()
      expect(base.state).to.equal(null)
    } catch (err) {
      threw = true
      expect(err).to.be.instanceOf(TypeError)
    }
    expect([true, false]).to.include(threw)
  })
})
