import { expect } from 'chai'
import Base from '../class/base.js'

function makeMockApp({ mainNs = 'app-main', throwOnDataConfig = false } = {}) {
  // small lodash-like helpers used by Base.loadConfig
  const _ = {
    get: (obj, path, defVal) => {
      if (!obj) return defVal
      const parts = String(path).split('.')
      let cur = obj
      for (const p of parts) {
        if (cur == null) return defVal
        cur = cur[p]
      }
      return cur === undefined ? defVal : cur
    },
    kebabCase: s => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
    keys: obj => obj ? Object.keys(obj) : [],
    pick: (obj, keys) => {
      const out = {}
      if (!obj) return out
      for (const k of keys) if (k in obj) out[k] = obj[k]
      return out
    }
  }

  // simple defaultsDeep-ish helper suitable for these tests:
  // later objects in args take precedence over earlier ones (shallow)
  const defaultsDeep = (...objs) => Object.assign({}, ...objs.filter(Boolean))

  // bajo helpers (file reads etc). readAllConfigs will be called twice by Base.loadConfig:
  //  - once for module dir config
  //  - once for data dir config (may throw)
  let readAllCalls = 0
  const readAllConfigs = async (path) => {
    readAllCalls += 1
    if (throwOnDataConfig && readAllCalls === 2) throw new Error('readAllConfigs data dir error')
    // return a small config object to test merge/path logic
    return { alpha: 'file', title: 'FromFile', other: 'ignore-me' }
  }

  return {
    mainNs,
    lib: { aneka: { defaultsDeep }, _: _ },
    bajo: {
      dir: { base: '/base', data: '/data' },
      readAllConfigs,
      readJson: async (p) => ({ name: 'bajo-foo', version: '1.2.3', description: 'pkg' }),
      parseObject: (o) => o,
      getModuleDir: (pkgName) => `/modules/${pkgName}`,
      log: { trace: () => {} }
    },
    env: {},
    argv: {}
  }
}

describe('Base.loadConfig', () => {
  it('derives alias from pkgName starting with "bajo-" using kebabCase', async () => {
    const app = makeMockApp()
    const inst = new Base('bajo-MyPlugin', app)
    // ensure namespace used by loadConfig
    inst.ns = 'myplugin'
    // set an initial config shape so defKeys isn't empty
    inst.config = { alpha: 'default', title: 'Default' }

    await inst.loadConfig()

    // alias is stored on the constructor
    expect(inst.constructor.alias).to.equal('my-plugin')
    // dir pkg should be set according to mainNs mismatch
    expect(inst.dir.pkg).to.equal('/modules/bajo-MyPlugin')
    // config should keep keys only from defKeys (alpha & title), parseObject ran (no throw)
    expect(Object.keys(inst.config)).to.include('alpha')
    expect(Object.keys(inst.config)).to.include('title')
  })

  it('when ns === app.mainNs uses app.mainNs as alias and sets title to alias', async () => {
    const app = makeMockApp({ mainNs: 'mainns' })
    const inst = new Base('bajo-mainpkg', app)
    inst.ns = 'mainns'
    inst.config = { title: undefined } // start with no title

    await inst.loadConfig()

    expect(inst.constructor.alias).to.equal('mainns')
    // title should be set to alias when ns is mainNs
    expect(inst.title).to.equal(inst.constructor.alias)
  })

  it('continues when readAllConfigs for data dir throws (tolerant behavior)', async () => {
    const app = makeMockApp({ throwOnDataConfig: true })
    const inst = new Base('bajo-throwtest', app)
    inst.ns = 'throwtest'
    inst.config = { alpha: 'start' }

    // should not throw even if second readAllConfigs throws
    let threw = false
    try {
      await inst.loadConfig()
    } catch (err) {
      threw = true
    }
    expect(threw).to.equal(false)
    // config should still be an object and title present (or undefined but not crash)
    expect(inst.config).to.be.an('object')
  })
})