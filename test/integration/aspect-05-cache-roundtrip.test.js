/* global describe, it, beforeEach, afterEach */

import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 05 - cache roundtrip', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a05-')
    await writeBaseApp(root, 'int-a05-plugin')
    await writePlugin(root, 'int-a05-plugin', 'IntA05', '')
  })

  afterEach(() => cleanupRoot(root))

  it('persists and reads cache values through app.cache', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    const payload = { ok: true, ids: [1, 2, 3] }
    await app.cache.save('bajo.demo:path/item', payload, 60000)
    const loaded = await app.cache.load('bajo.demo:path/item', 60000)
    expect(loaded).to.deep.equal(payload)
  })
})
