/* global describe, it */

import { expect } from 'chai'

import { outmatchNs, parseObject, lib } from '../class/_helper.js'

describe('_helper', () => {
  it('matches namespace/path patterns', () => {
    const ctx = {
      bajo: {
        breakNsPath: (pattern) => {
          const [fullNs, p] = pattern.split(':')
          return { fullNs, path: p }
        }
      }
    }

    expect(outmatchNs.call(ctx, 'demo.api:users/12', 'demo.api:users/*')).to.equal(true)
    expect(outmatchNs.call(ctx, 'demo.api', 'demo.api')).to.equal(true)
    expect(outmatchNs.call(ctx, 'demo.api:users/12', 'x.api:users/*')).to.equal(false)
  })

  it('parses object and applies translator from namespace', () => {
    const ctx = {
      bajo: {
        t: (text, arg) => `T:${text}:${arg}`
      }
    }
    const parsed = parseObject.call(ctx, { msg: 't:hello|world' }, { ns: 'bajo', lang: 'en-US', parseValue: true })

    expect(parsed).to.deep.equal({ msg: 'T:hello:world' })
  })

  it('exports library helpers', () => {
    expect(lib).to.have.property('_')
    expect(lib).to.have.property('fs')
    expect(lib).to.have.property('dayjs')
  })
})
