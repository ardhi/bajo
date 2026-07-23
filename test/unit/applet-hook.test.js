/* global describe, it */

import { expect } from 'chai'

describe('applet-hook module (unit)', () => {
  it('is importable documentation-only module', async () => {
    const mod = await import('../../lib/applet-hook.js')
    expect(mod).to.not.equal(undefined)
  })
})
