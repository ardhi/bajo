/* global describe, it, beforeEach */

import { expect } from 'chai'
import lodash from 'lodash'

import Base from '../class/base.js'

describe('Base', () => {
  let app

  beforeEach(() => {
    app = {
      mainNs: 'main',
      getAllNs: () => ['alpha', 'beta'],
      lib: {
        _: lodash,
        aneka: {
          defaultsDeep: (...objs) => lodash.defaultsDeep(...objs)
        },
        parseObject: (obj) => obj
      },
      bajo: {
        dir: { base: '/app', data: '/data' },
        config: { env: 'dev' },
        log: { trace: () => {} },
        getModuleDir: () => '/modules/my-plugin',
        readAllConfigs: async () => ({ fromFile: true })
      },
      env: {
        myPlugin: { x: 3 }
      },
      argv: {
        myPlugin: { y: 2 }
      },
      options: {
        config: {
          myPlugin: { z: 1 }
        }
      }
    }
  })

  it('initializes defaults', () => {
    const base = new Base('my-plugin', app)

    expect(base.ns).to.equal('myPlugin')
    expect(base.dependencies).to.deep.equal([])
    expect(base.state).to.deep.equal({})
    expect(base.pkg).to.deep.equal({})
  })

  it('loads config and sets package/data directories', async () => {
    const base = new Base('my-plugin', app)
    base.config = { title: 'my app', z: 9, x: 0, y: 0 }

    await base.loadConfig()

    expect(base.dir).to.deep.equal({
      pkg: '/modules/my-plugin',
      data: '/data/plugins/myPlugin'
    })
    expect(base.getConfig('x')).to.equal(3)
    expect(base.getConfig('y')).to.equal(2)
    expect(base.getConfig('z')).to.equal(1)
    expect(base.getConfig('title')).to.equal('my app')
  })

  it('runs no-op lifecycle methods and exits by disposing', async () => {
    const base = new Base('my-plugin', app)

    await base.init()
    await base.start()
    await base.stop()
  })
})
