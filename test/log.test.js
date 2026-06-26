/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'
import dayjs from 'dayjs'

import Log from '../class/log.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-log-test-'))

describe('Log', () => {
  let root
  let app
  let log

  beforeEach(() => {
    root = createTempRoot()
    app = {
      runAt: new Date(),
      t: (prefix, text, ...args) => `${prefix}:${text}:${args.join('|')}`,
      lib: {
        fs,
        dayjs,
        _: {
          isEmpty: (v) => v == null || v === '' || (typeof v === 'object' && Object.keys(v).length === 0),
          merge: (a, b) => Object.assign(a, b),
          without: (arr, item) => arr.filter(i => i !== item)
        }
      },
      bajo: {
        dir: { data: root },
        config: {
          env: 'dev',
          log: {
            level: 'trace',
            save: false,
            pretty: false,
            useUtc: false,
            timeTaken: false,
            dateFormat: 'YYYY-MM-DD',
            rotation: { cycle: 'none', byPlugin: false }
          }
        },
        isLogInRange: () => true
      }
    }
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('formats and prints messages in dev mode', () => {
    const originalLog = console.log
    const lines = []
    console.log = (line) => lines.push(line)
    log = new Log(app)

    try {
      log.info('main', 'hello %s', 'x')
    } finally {
      console.log = originalLog
    }

    expect(lines.length).to.equal(1)
    expect(lines[0]).to.include('[INFO]')
    expect(lines[0]).to.include('[main]')
    expect(lines[0]).to.include('main:hello %s:x')
  })

  it('returns error message fallback by code/statusCode', () => {
    log = new Log(app)

    expect(log.getErrorMessage(new Error('x'))).to.equal('x')
    expect(log.getErrorMessage({ message: '', code: 'E1' })).to.equal('E1')
    expect(log.getErrorMessage({ message: '', statusCode: 404 })).to.equal(404)
  })

  it('builds rotation patterns and saves file', () => {
    app.bajo.config.log.save = true
    log = new Log(app)
    app.bajo.config.log.rotation.cycle = 'daily'

    const pattern = log.getRotationPattern()
    log.save('\u001b[31mhello\u001b[0m', 'x')

    expect(pattern).to.be.a('string')
    expect(fs.existsSync(path.join(root, 'log', `bajo.${pattern}.log`))).to.equal(true)
  })

  it('supports prod json output', () => {
    app.bajo.config.env = 'prod'
    log = new Log(app)
    const originalLog = console.log
    const lines = []
    console.log = (line) => lines.push(line)

    try {
      log.warn('core', { id: 1 }, 'hi')
    } finally {
      console.log = originalLog
    }

    const payload = JSON.parse(lines[0])
    expect(payload.prefix).to.equal('core')
    expect(payload.level).to.be.a('number')
    expect(payload).to.have.property('data')
  })

  it('disposes app reference', async () => {
    log = new Log(app)

    await log.dispose()

    expect(log.app).to.equal(null)
  })
})
