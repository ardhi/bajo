/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import App from '../../class/app.js'
import Bajo from '../../class/bajo.js'
import Cache from '../../class/cache.js'

describe('cache (unit)', () => {
  let root
  let app
  let bajo
  let cache

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-cache-unit-'))
    await fs.ensureDir(path.join(root, 'data'))
    app = new App({ cwd: root })
    bajo = new Bajo(app)
    app.bajo = bajo
    bajo.dir = { data: path.join(root, 'data') }
    cache = new Cache(app)
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('getRootDir returns bajo cache root', () => {
    expect(cache.getRootDir()).to.include('/plugins/bajo/cache')
  })

  it('prep creates directories for valid namespaced key', () => {
    const p = cache.prep('bajo.api:path/item', 60000)
    expect(p.file).to.include('/bajo/api/60000/path/item')
  })

  it('prep returns undefined when ttl is 0 or sub namespace absent', () => {
    expect(cache.prep('bajo:path/item', 60000)).to.equal(undefined)
    expect(cache.prep('bajo.api:path/item', 0)).to.equal(undefined)
  })

  it('save and load work for objects', async () => {
    const val = { ok: true, arr: [1, 2] }
    await cache.save('bajo.api:path/item', val, 60000)
    const loaded = await cache.load('bajo.api:path/item', 60000)
    expect(loaded).to.deep.equal(val)
  })

  it('load removes expired cache directories', async () => {
    const ttl = 1
    await cache.save('bajo.api:path/item', 'v', ttl)
    const p = cache.prep('bajo.api:path/item', ttl)
    const old = Date.now() - 60000
    fs.utimesSync(p.dir, old / 1000, old / 1000)
    const loaded = await cache.load('bajo.api:path/item', ttl)
    expect(loaded).to.equal(undefined)
    expect(fs.existsSync(p.dir)).to.equal(false)
  })

  it('sync reflects current implementation behavior', async () => {
    let thrown
    try {
      await cache.sync('bajo.api:path/item', { x: 1 }, 60000)
    } catch (err) {
      thrown = err
    }
    expect(thrown).to.be.instanceOf(TypeError)
  })

  it('_purgeItem and purge remove cache entries', async () => {
    await cache.save('bajo.api:path/one', 'a', 60000)
    await cache.save('bajo.api:path/two', 'b', 60000)
    await cache.save('bajo.mod:path/three', 'c', 60000)

    cache._purgeItem('bajo')
    expect(fs.existsSync(path.join(cache.getRootDir(), 'bajo'))).to.equal(false)

    await cache.save('bajo.api:path/four', 'd', 60000)
    cache.purge('*')
    expect(fs.existsSync(cache.getRootDir())).to.equal(true)
  })

  it('dispose clears app reference', async () => {
    await cache.dispose()
    expect(cache.app).to.equal(null)
  })
})
