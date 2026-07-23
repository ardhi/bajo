/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'

describe('index (unit)', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-index-unit-'))
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('boot returns app instance for valid module app', async function () {
    this.timeout(10000)
    await fs.writeJson(path.join(root, 'package.json'), { name: 'app', type: 'module', bajo: { plugins: [] } })
    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'data', 'config', 'bajo.json'), { log: { level: 'silent', save: false }, exitHandler: false, cache: { purgeIntvDur: '1h' } })

    const old = global.setInterval
    const ids = []
    global.setInterval = (fn, delay, ...args) => {
      const id = old(fn, delay, ...args)
      ids.push(id)
      return id
    }

    const app = await boot({ cwd: root })
    expect(app).to.be.an('object')
    expect(app.bajo).to.be.an('object')

    global.setInterval = old
    for (const id of ids) clearInterval(id)
  })
})
