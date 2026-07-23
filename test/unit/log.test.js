/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import lodash from 'lodash'
import dayjs from 'dayjs'
import { expect } from 'chai'
import App from '../../class/app.js'
import Log, { logLevels } from '../../class/log.js'

describe('log (unit)', () => {
  let root
  let app
  let log

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-log-unit-'))
    await fs.ensureDir(path.join(root, 'data'))
    app = new App({ cwd: root })
    app.lib._ = lodash
    app.lib.dayjs = dayjs
    app.t = (_prefix, text, ...args) => args.length ? `${text}${args.join('')}` : text
    app.bajo = {
      dir: { data: path.join(root, 'data') },
      config: { env: 'dev', log: { level: 'trace', save: false, pretty: false, useUtc: false, timeTaken: true, dateFormat: 'YYYY-MM-DD', rotation: { cycle: 'none', byPlugin: false } } },
      isLogInRange: () => true
    }
    log = new Log(app)
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('exports known log levels', () => {
    expect(logLevels.trace.number).to.equal(10)
    expect(logLevels.silent.number).to.equal(99)
  })

  it('getErrorMessage handles message and fallback fields', () => {
    expect(log.getErrorMessage(new Error('x'))).to.equal('x')
    expect(log.getErrorMessage({ message: '', code: 'E' })).to.equal('E')
  })

  it('getRotationPattern supports none/daily/weekly/monthly', () => {
    app.bajo.config.log.rotation.cycle = 'none'
    expect(log.getRotationPattern()).to.equal(undefined)
    app.bajo.config.log.rotation.cycle = 'daily'
    expect(log.getRotationPattern()).to.be.a('string')
    app.bajo.config.log.rotation.cycle = 'weekly'
    expect(log.getRotationPattern()).to.be.a('string')
    app.bajo.config.log.rotation.cycle = 'monthly'
    expect(log.getRotationPattern()).to.be.a('string')
  })

  it('formatMsg handles string payload and error payload paths', () => {
    log.formatMsg('info', 'demo', 'hi%s', 'x')
    log.formatMsg('error', 'demo', new Error('boom'))
  })

  it('save writes clean lines to log files', () => {
    app.bajo.config.log.save = true
    app.bajo.config.log.rotation.cycle = 'daily'
    fs.ensureDirSync(log.logDir)
    log.save('line', 'demo')
    const files = fs.readdirSync(log.logDir)
    expect(files.length).to.be.greaterThan(0)
  })

  it('trace/debug/info/warn/error/fatal/silent wrappers call format path', () => {
    log.trace('d', 'a')
    log.debug('d', 'a')
    log.info('d', 'a')
    log.warn('d', 'a')
    log.error('d', 'a')
    log.fatal('d', 'a')
    log.silent('d', 'a')
  })

  it('dispose clears app reference', async () => {
    await log.dispose()
    expect(log.app).to.equal(null)
  })
})
