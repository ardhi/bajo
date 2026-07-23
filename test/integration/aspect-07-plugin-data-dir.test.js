/* global describe, it, beforeEach, afterEach */

import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 07 - plugin data dir', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a07-')
    await writeBaseApp(root, 'int-a07-plugin')
    await writePlugin(root, 'int-a07-plugin', 'IntA07', "const d = this.app.getPluginDataDir(this.ns); this.app.lib.fs.writeFileSync(d + '/ready.txt', '1', 'utf8')")
  })

  afterEach(() => cleanupRoot(root))

  it('creates plugin data dir and allows writes during plugin start', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    const d = app.getPluginDataDir('intA07Plugin')
    expect(fs.existsSync(d + '/ready.txt')).to.equal(true)
  })
})
