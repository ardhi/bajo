/* global describe, it */

import { expect } from 'chai'
import Tools from '../../class/tools.js'

describe('tools (unit)', () => {
  it('constructor stores plugin and app references', () => {
    const plugin = { app: { name: 'app' } }
    const t = new Tools(plugin)
    expect(t.plugin).to.equal(plugin)
    expect(t.app).to.equal(plugin.app)
  })

  it('bindThis binds methods to instance context', () => {
    const t = new Tools({ app: {} })
    t.value = 42
    t.getValue = function () { return this.value }
    t.bindThis('getValue')
    const fn = t.getValue
    expect(fn()).to.equal(42)
  })

  it('dispose clears internal references', async () => {
    const t = new Tools({ app: { ok: true } })
    await t.dispose()
    expect(t.app).to.equal(null)
    expect(t.plugin).to.equal(null)
  })
})
