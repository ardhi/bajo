/* global describe, it */

import lodash from 'lodash'
import aneka from 'aneka'
import { expect } from 'chai'
import Err from '../../class/err.js'

describe('err (unit)', () => {
  const makePlugin = () => {
    let exited = false
    const plugin = {
      ns: 'demo',
      app: { lib: { _: lodash, aneka }, exit: () => { exited = true } },
      t: (text, ...args) => {
        if (text === 'error') return 'Error'
        if (text === 'fieldError%s%s') return `${args[0]}:${args[1]}`
        if (text.startsWith('validation.')) return text
        if (text.startsWith('field.')) return text
        return args.length ? `${text}:${args.filter(a => typeof a !== 'object').join(',')}` : text
      }
    }
    return { plugin, getExited: () => exited }
  }

  it('constructor sets payload and translated message', () => {
    const { plugin } = makePlugin()
    const e = new Err(plugin, 'msg', 'a', { code: 'E1' })
    expect(e.payload.code).to.equal('E1')
    expect(e.orgMessage).to.equal('msg')
    expect(e.message).to.equal('msg:a')
  })

  it('write builds Error object with metadata', () => {
    const { plugin } = makePlugin()
    const err = new Err(plugin, 'msg', { code: 'E2' }).write()
    expect(err).to.be.instanceOf(Error)
    expect(err.code).to.equal('E2')
    expect(err.ns).to.equal('demo')
    expect(err.orgMessage).to.equal('msg')
  })

  it('formatErrorDetails formats structured validation entries', () => {
    const { plugin } = makePlugin()
    const e = new Err(plugin, 'x')
    const details = [{ message: '~invalid', context: { key: 'name', value: 'john', valids: ['a', 'b'] }, type: 'any.only' }]
    const result = e.formatErrorDetails(details)
    expect(result.detailsMessage).to.include('Error:')
    expect(details[0].field).to.equal('name')
  })

  it('fatal writes and triggers app exit', () => {
    const { plugin, getExited } = makePlugin()
    const e = new Err(plugin, 'fatal')
    e.fatal()
    expect(getExited()).to.equal(true)
  })
})
