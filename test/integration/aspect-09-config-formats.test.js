/* global describe, it, beforeEach, afterEach */

import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 09 - config formats', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a09-')
    await writeBaseApp(root, 'int-a09-plugin')
    await writePlugin(root, 'int-a09-plugin', 'IntA09', '')
  })

  afterEach(() => cleanupRoot(root))

  it('provides config format registry from runtime handlers', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    const exts = app.getConfigFormats()
    expect(exts).to.include('.json')
    expect(exts).to.include('.yml')
    expect(app.getConfigFormats(true)).to.include('json')
  })
})
