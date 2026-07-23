/* global describe, it, beforeEach, afterEach */

import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 01 - boot instance', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a01-')
    await writeBaseApp(root, 'int-a01-plugin')
    await writePlugin(root, 'int-a01-plugin', 'IntA01', "await this.app.lib.fs.writeFile(this.app.dir + '/a01.txt', 'ok', 'utf8')")
  })

  afterEach(() => cleanupRoot(root))

  it('boots app instance successfully', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    expect(app).to.be.an('object')
    expect(app.bajo).to.be.an('object')
  })
})
