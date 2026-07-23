/* global describe, it */

import dayjs from 'dayjs'
import { expect } from 'chai'
import Print from '../../class/print.js'

describe('print (unit)', () => {
  const make = () => {
    let exited = false
    const plugin = {
      ns: 'demo',
      t: (text, ...args) => args.length ? `${text}${args.join('')}` : text,
      app: {
        applet: false,
        lib: { dayjs },
        bajo: { config: { silent: false, counter: false, datetime: false } },
        exit: () => { exited = true }
      }
    }
    return { print: new Print(plugin, { ora: { isEnabled: false }, showCounter: true, showDatetime: true }), getExited: () => exited }
  }

  it('setOpts updates options with silent inheritance', () => {
    const { print } = make()
    print.setOpts({ silent: false })
    expect(print.options.silent).to.equal(false)
  })

  it('buildText prefixes datetime and counter', () => {
    const { print } = make()
    const t = print.buildText('hello')
    expect(t).to.include('hello')
    expect(t.startsWith('[')).to.equal(true)
  })

  it('setText updates spinner text', () => {
    const { print } = make()
    print.setText('abc')
    expect(print.ora.text).to.include('abc')
  })

  it('getElapsed supports default and custom units', () => {
    const { print } = make()
    expect(print.getElapsed('hms')).to.be.a('string')
    expect(print.getElapsed('ms')).to.be.a('number')
  })

  it('start/stop/succeed/fail/warn/info/clear/render are chainable', () => {
    const { print } = make()
    expect(print.start('a')).to.equal(print)
    expect(print.stop()).to.equal(print)
    expect(print.succeed('b')).to.equal(print)
    expect(print.fail('c')).to.equal(print)
    expect(print.warn('d')).to.equal(print)
    expect(print.info('e')).to.equal(print)
    expect(print.clear()).to.equal(print)
    expect(print.render()).to.equal(print)
  })

  it('fatal handles Error and exits app', () => {
    const { print, getExited } = make()
    print.fatal(new Error('bad'))
    expect(getExited()).to.equal(true)
  })

  it('spinner creates new instance sharing baseline time', () => {
    const { print } = make()
    const s = print.spinner()
    expect(s).to.be.instanceOf(Print)
    expect(s.startTime.valueOf()).to.equal(print.startTime.valueOf())
  })
})
