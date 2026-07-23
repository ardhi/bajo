/* global describe, it */

import { expect } from 'chai'
import config from '../../lib/config.js'

describe('config module (unit)', () => {
  it('exports expected defaults', () => {
    expect(config.env).to.equal('dev')
    expect(config.log.rotation.cycle).to.equal('none')
    expect(config.intl.supported).to.include('en-US')
    expect(config.cache.purgeIntvDur).to.equal('5m')
    expect(config.exitHandler).to.equal(true)
  })
})
