/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import lodash from 'lodash'
import { expect } from 'chai'
import Plugin from '../../class/plugin.js'

const mk = async () => fs.mkdtemp(path.join('/tmp', 'bajo-plugin-unit-'))

describe('plugin (unit)', () => {
  let dir
  let app
  let plugin

  beforeEach(async () => {
    dir = await mk()
    await fs.writeJson(path.join(dir, 'package.json'), { name: 'pkg', version: '1.2.3', description: 'd', author: 'a', license: 'MIT', homepage: 'h', bajo: { type: 'plugin' } })
    app = {
      lib: { _: lodash, fs },
      log: { trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, silent: () => {} },
      t: (_ns, text, ...args) => args.length ? `${text}:${args.join(',')}` : text,
      te: () => true,
      dump: () => {}
    }
    plugin = new Plugin('demo-plugin', app)
    plugin.dir = { pkg: dir }
  })

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true })
  })

  it('constructor maps namespace and log wrappers', () => {
    expect(plugin.pkgName).to.equal('demo-plugin')
    expect(plugin.ns).to.equal('demoPlugin')
    expect(plugin.alias).to.equal(null)
    expect(plugin.config).to.deep.equal({})
    plugin.log.info('x')
  })

  it('getPkgInfo returns selected keys and full package', () => {
    const selected = plugin.getPkgInfo()
    const full = plugin.getPkgInfo(undefined, [])
    expect(selected).to.deep.equal({ name: 'pkg', version: '1.2.3', description: 'd', author: 'a', license: 'MIT', homepage: 'h', bajo: { type: 'plugin' } })
    expect(full.name).to.equal('pkg')
  })

  it('getConfig supports path, defaults, omit and noClone', () => {
    plugin.config = { a: { b: 1, c: 2 } }
    const p = plugin.getConfig('a', { omit: ['c'] })
    expect(p).to.deep.equal({ b: 1 })
    const def = plugin.getConfig('a.d', { defValue: 9 })
    expect(def).to.equal(9)
    const nc = plugin.getConfig('a', { noClone: true })
    nc.b = 7
    expect(plugin.config.a.b).to.equal(7)
  })

  it('error/fatal return native Error when print is absent', () => {
    const e = plugin.error('m')
    const f = plugin.fatal('n')
    expect(e).to.be.instanceOf(Error)
    expect(f).to.be.instanceOf(Error)
  })

  it('t and te delegate to app translation APIs', () => {
    expect(plugin.t('hello', 'a')).to.equal('hello:a')
    expect(plugin.te('hello')).to.equal(true)
  })

  it('bindThis binds string and function entries', () => {
    plugin.value = 'ok'
    plugin.one = function () { return this.value }
    function two () { return this.pkgName }
    plugin.bindThis('one', two)
    const a = plugin.one
    const b = plugin.two
    expect(a()).to.equal('ok')
    expect(b()).to.equal('demo-plugin')
  })

  it('dump forwards call to app.dump', () => {
    let args
    app.dump = (...a) => { args = a }
    plugin.dump('x', 1)
    expect(args).to.deep.equal(['x', 1])
  })

  it('dispose clears app and config references', async () => {
    await plugin.dispose()
    expect(plugin.app).to.equal(null)
    expect(plugin.config).to.equal(null)
  })
})
