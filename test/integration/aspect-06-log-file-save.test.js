/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 06 - log save', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a06-')
    await writeBaseApp(root, 'int-a06-plugin', { log: { level: 'trace', save: true, pretty: false, useUtc: false, timeTaken: false, dateFormat: 'YYYY-MM-DD', rotation: { cycle: 'none', byPlugin: false } } })
    await writePlugin(root, 'int-a06-plugin', 'IntA06', '')
  })

  afterEach(() => cleanupRoot(root))

  it('writes log file when save is enabled', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    app.log.info('demo', 'saved%s', 'ok')
    const logFile = path.join(root, 'data', 'log', 'bajo.log')
    expect(fs.existsSync(logFile)).to.equal(true)
    expect(fs.readFileSync(logFile, 'utf8')).to.include('saved')
  })
})
