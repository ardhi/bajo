/* global describe, it, beforeEach, afterEach */

import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 08 - plugin lookup', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a08-')
    await writeBaseApp(root, 'int-a08-plugin')
    await writePlugin(root, 'int-a08-plugin', 'IntA08', '')
  })

  afterEach(() => cleanupRoot(root))

  it('resolves plugin by namespace and package name', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    const byNs = app.getPlugin('intA08Plugin')
    const byPkg = app.getPlugin('int-a08-plugin')
    expect(byNs).to.equal(byPkg)
  })
})
