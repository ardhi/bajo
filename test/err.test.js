/* global describe, it */

import { expect } from 'chai'
import lodash from 'lodash'

import Err from '../class/err.js'

describe('Err', () => {
  const makePlugin = () => ({
    ns: 'myPlugin',
    app: {
      lib: {
        _: lodash,
        aneka: { without: (arr) => arr.filter(Boolean) }
      },
      exit: () => {}
    },
    t: (msg, ctx) => {
      if (msg === 'error') return 'Error'
      if (msg === 'fieldError%s%s') return `${ctx}`
      return msg
    }
  })

  it('writes error object with payload and metadata', () => {
    const plugin = makePlugin()
    const err = new Err(plugin, 'hello %s', 'x', { code: 'E1', foo: 'bar' }).write()

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.equal('hello %s')
    expect(err.code).to.equal('E1')
    expect(err.foo).to.equal('bar')
    expect(err.ns).to.equal('myPlugin')
    expect(err.orgMessage).to.equal('hello %s')
  })

  it('formats details payload into detailsMessage', () => {
    const plugin = makePlugin()
    plugin.t = (msg) => {
      if (msg === 'error') return 'Error'
      if (msg === 'fieldError%s%s') return 'field-error'
      if (msg.startsWith('validation.')) return 'invalid value'
      return msg
    }
    const item = {
      type: 'string.base',
      message: '~invalid value',
      context: { key: 'name', value: 1 }
    }
    const err = new Err(plugin, 'bad', { details: [item] }).write()

    expect(err).to.have.property('detailsMessage').that.includes('Error:')
    expect(err.details[0]).to.include({ field: 'name', error: 'invalid value', value: 1 })
  })

  it('prints and exits on fatal', () => {
    const plugin = makePlugin()
    let exitArg
    plugin.app.exit = (arg) => { exitArg = arg }
    const originalError = console.error
    let called = false
    console.error = () => { called = true }

    try {
      new Err(plugin, 'boom').fatal()
    } finally {
      console.error = originalError
    }

    expect(called).to.equal(true)
    expect(exitArg).to.equal(true)
  })
})
