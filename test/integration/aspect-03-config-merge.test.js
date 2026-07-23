/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 03 - config merge', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a03-')
    await writeBaseApp(root, 'int-a03-plugin')
    await writePlugin(root, 'int-a03-plugin', 'IntA03', '')
    await fs.writeJson(path.join(root, 'data', 'config', 'intA03Plugin.json'), { marker: 'override', feature: false })
  })

  afterEach(() => cleanupRoot(root))

  it('merges plugin runtime config from data/config', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    expect(app.intA03Plugin.getConfig('marker')).to.equal('override')
    expect(app.intA03Plugin.getConfig('feature')).to.equal(false)
  })
})
