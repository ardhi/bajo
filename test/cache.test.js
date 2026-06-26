/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import lodash from 'lodash'

import Cache from '../class/cache.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-cache-test-'))

describe('Cache', () => {
  let root
  let app
  let cache

  beforeEach(() => {
    root = createTempRoot()
    app = {
      getPluginDataDir: () => path.join(root, 'bajo'),
      bajo: {
        breakNsPath: (name) => {
          const [nsPart, p] = name.split(':')
          const [ns, subNs] = nsPart.split('.')
          return { ns, subNs, path: p }
        }
      },
      lib: {
        aneka: {
          parseDuration: (v) => typeof v === 'number' ? v : 0
        },
        fs,
        fastGlob,
        _: lodash
      }
    }
    cache = new Cache(app)
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('prepares cache location only for namespaced key and non-zero ttl', () => {
    expect(cache.prep('main:path', 0)).to.equal(undefined)
    expect(cache.prep('main:path', 1000)).to.equal(undefined)

    const prep = cache.prep('main.api:path/to/item', 1000)
    expect(prep.file).to.include('/main/api/1000/path/to/item')
    expect(fs.existsSync(prep.dir)).to.equal(true)
  })

  it('saves and loads json/object content', async () => {
    await cache.save('main.api:item', { a: 1 }, 1000)
    const item = await cache.load('main.api:item', 1000)

    expect(item).to.deep.equal({ a: 1 })
  })

  it('returns undefined for expired cache and removes ttl directory', async () => {
    await cache.save('main.api:item', 'ok', 1)
    const { dir } = cache.prep('main.api:item', 1)
    const old = Date.now() - 5000
    fs.utimesSync(dir, old / 1000, old / 1000)

    const result = await cache.load('main.api:item', 1)

    expect(result).to.equal(undefined)
    expect(fs.existsSync(dir)).to.equal(false)
  })

  it('purges by name and wildcard', () => {
    const a = cache.prep('main.api:a', 1000)
    const b = cache.prep('main.web:b', 1000)
    fs.writeFileSync(a.file, 'a', 'utf8')
    fs.writeFileSync(b.file, 'b', 'utf8')

    cache.purge('main')
    expect(fs.existsSync(cache.getRootDir() + '/main')).to.equal(false)

    const c = cache.prep('other.api:c', 1000)
    fs.writeFileSync(c.file, 'c', 'utf8')
    cache._purgeItem('*')
    expect(fs.existsSync(cache.getRootDir() + '/other')).to.equal(false)
  })

  it('disposes app reference', async () => {
    await cache.dispose()

    expect(cache.app).to.equal(null)
  })
})
