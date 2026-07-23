/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 10 - hook execution', () => {
  let root
  let pluginDir

  beforeEach(async () => {
    root = makeRoot('bajo-int-a10-')
    await writeBaseApp(root, 'int-a10-plugin')
    pluginDir = await writePlugin(root, 'int-a10-plugin', 'IntA10', "await this.app.lib.fs.writeFile(this.app.dir + '/plugin-start.txt', 'started', 'utf8')")

    const hookDir = path.join(pluginDir, 'extend', 'bajo', 'hook')
    await fs.ensureDir(hookDir)
    await fs.writeFile(path.join(hookDir, 'bajo@after-boot.js'), `
export default {
  level: 100,
  handler: async function () {
    await this.app.lib.fs.writeFile(this.app.dir + '/after-boot.txt', 'ok', 'utf8')
  }
}
`, 'utf8')
  })

  afterEach(() => cleanupRoot(root))

  it('collects and runs plugin hook during boot lifecycle', async function () {
    this.timeout(12000)
    await boot({ cwd: root })
    expect(fs.existsSync(path.join(root, 'plugin-start.txt'))).to.equal(true)
    expect(fs.existsSync(path.join(root, 'after-boot.txt'))).to.equal(true)
  })
})
