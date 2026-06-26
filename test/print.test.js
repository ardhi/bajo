/* global describe, it, beforeEach */

import { expect } from 'chai'
import dayjs from 'dayjs'

import Print from '../class/print.js'

describe('Print', () => {
  let plugin
  let print

  beforeEach(() => {
    plugin = {
      app: {
        applet: false,
        exit: () => {},
        lib: { dayjs },
        bajo: {
          config: {
            silent: false,
            counter: false,
            datetime: false
          }
        }
      },
      t: (text, ...args) => `${text}:${args.join('|')}`
    }
    print = new Print(plugin)
    print.ora = {
      text: '',
      startCalled: false,
      stopCalled: false,
      start () { this.startCalled = true },
      stop () { this.stopCalled = true },
      succeedCalled: false,
      succeed () { this.succeedCalled = true },
      failCalled: false,
      fail () { this.failCalled = true },
      warnCalled: false,
      warn () { this.warnCalled = true },
      infoCalled: false,
      info () { this.infoCalled = true },
      clearCalled: false,
      clear () { this.clearCalled = true },
      renderCalled: false,
      render () { this.renderCalled = true }
    }
  })

  it('builds translated text with optional prefixes', () => {
    print.options.showCounter = true

    const text = print.buildText('hello')

    expect(text).to.include('hello:')
    expect(text).to.match(/\[\d\d:/)
  })

  it('starts and stops spinner', () => {
    print.start('start')
    print.stop()

    expect(print.ora.startCalled).to.equal(true)
    expect(print.ora.stopCalled).to.equal(true)
  })

  it('uses succeed/fail/warn/info/clear/render chainable methods', () => {
    expect(print.succeed('ok')).to.equal(print)
    expect(print.fail('x')).to.equal(print)
    expect(print.warn('w')).to.equal(print)
    expect(print.info('i')).to.equal(print)
    expect(print.clear()).to.equal(print)
    expect(print.render()).to.equal(print)

    expect(print.ora.succeedCalled).to.equal(true)
    expect(print.ora.failCalled).to.equal(true)
    expect(print.ora.warnCalled).to.equal(true)
    expect(print.ora.infoCalled).to.equal(true)
    expect(print.ora.clearCalled).to.equal(true)
    expect(print.ora.renderCalled).to.equal(true)
  })

  it('fails and exits on fatal', () => {
    let exited = false
    plugin.app.exit = () => { exited = true }

    print.fatal('boom')

    expect(print.ora.failCalled).to.equal(true)
    expect(exited).to.equal(true)
  })

  it('creates a new spinner sharing start time', () => {
    const spin = print.spinner()

    expect(spin).to.be.instanceOf(Print)
    expect(spin).to.not.equal(print)
    expect(spin.startTime.valueOf()).to.equal(print.startTime.valueOf())
  })
})
