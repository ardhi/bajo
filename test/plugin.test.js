/* global describe, it, beforeEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'
import lodash from 'lodash'

import Plugin from '../class/plugin.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-plugin-test-'))

describe('Plugin', () => {
  let app

  beforeEach(() => {
    const calls = []
    app = {
      lib: {
        _: lodash,
        fs
      },
      log: {
        trace: (...args) => calls.push(['trace', ...args]),
        debug: (...args) => calls.push(['debug', ...args]),
        info: (...args) => calls.push(['info', ...args]),
        warn: (...args) => calls.push(['warn', ...args]),
        error: (...args) => calls.push(['error', ...args]),
        fatal: (...args) => calls.push(['fatal', ...args]),
        silent: (...args) => calls.push(['silent', ...args])
      },
      t: (ns, text, ...params) => `${ns}:${text}:${params.join('|')}`,
      te: (ns, text) => `${ns}:${text}`,
      dump: (...args) => calls.push(['dump', ...args]),
      _calls: calls
    }
  })

  it('initializes namespace and prefixed log shortcuts', () => {
    const plugin = new Plugin('my-plugin', app)

    plugin.log.info('hello')

    expect(plugin.ns).to.equal('myPlugin')
    expect(app._calls[0]).to.deep.equal(['info', 'myPlugin', 'hello'])
  })

  it('reads package info and selected keys', async () => {
    const root = createTempRoot()
    const pkgDir = path.join(root, 'plugin')
    await fs.ensureDir(pkgDir)
    await fs.writeJson(path.join(pkgDir, 'package.json'), {
      name: 'my-plugin',
      version: '1.2.3',
      private: true
    })
    const plugin = new Plugin('my-plugin', app)
    plugin.dir = { pkg: pkgDir }

    expect(plugin.getPkgInfo()).to.deep.equal({
      name: 'my-plugin',
      version: '1.2.3'
    })
    expect(plugin.getPkgInfo(pkgDir, [])).to.include({ private: true })
  })

  it('returns config value with clone and omit support', () => {
    const plugin = new Plugin('my-plugin', app)
    plugin.config = { a: { b: 1, c: 2 } }

    const val = plugin.getConfig('a', { omit: ['c'] })
    val.b = 99

    expect(val).to.deep.equal({ b: 99 })
    expect(plugin.config.a.b).to.equal(1)
    expect(plugin.getConfig('missing', { defValue: { x: 1 } })).to.deep.equal({ x: 1 })
    expect(plugin.getConfig('a', { noClone: true })).to.equal(plugin.config.a)
  })

  it('returns native Error when print is unavailable', () => {
    const plugin = new Plugin('my-plugin', app)

    const err = plugin.error('plain error')
    const fatalErr = plugin.fatal('fatal error')

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.equal('plain error')
    expect(fatalErr).to.be.instanceOf(Error)
  })

  it('delegates translation and dump to app', () => {
    const plugin = new Plugin('my-plugin', app)

    expect(plugin.t('hello', 'x')).to.equal('myPlugin:hello:x')
    expect(plugin.te('hello')).to.equal('myPlugin:hello')
    plugin.dump(1, 2)

    expect(app._calls[0]).to.deep.equal(['dump', 1, 2])
  })

  it('binds methods and disposes references', async () => {
    const plugin = new Plugin('my-plugin', app)
    plugin.value = 42
    plugin.read = function () {
      return this.value
    }

    plugin.selfBind('read')
    const reader = plugin.read
    await plugin.dispose()

    expect(reader()).to.equal(42)
    expect(plugin.app).to.equal(null)
    expect(plugin.config).to.equal(null)
  })
})
