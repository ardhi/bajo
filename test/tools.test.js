/* global describe, it */

import { expect } from 'chai'

import Tools from '../class/tools.js'

describe('Tools', () => {
  it('stores plugin and app references', () => {
    const plugin = { app: { name: 'app' } }
    const tools = new Tools(plugin)

    expect(tools.plugin).to.equal(plugin)
    expect(tools.app).to.equal(plugin.app)
  })

  it('binds methods to self', () => {
    const plugin = { app: {} }
    const tools = new Tools(plugin)
    tools.value = 7
    tools.read = function () {
      return this.value
    }

    tools.selfBind(['read'])
    const rebound = tools.read

    expect(rebound()).to.equal(7)
  })

  it('disposes references', async () => {
    const tools = new Tools({ app: {} })

    await tools.dispose()

    expect(tools.app).to.equal(null)
    expect(tools.plugin).to.equal(null)
  })
})
