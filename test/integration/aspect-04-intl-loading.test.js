/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import fs from 'fs-extra'
import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 04 - intl loading', () => {
  let root
  let pluginDir

  beforeEach(async () => {
    root = makeRoot('bajo-int-a04-')
    await writeBaseApp(root, 'int-a04-plugin')
    pluginDir = await writePlugin(root, 'int-a04-plugin', 'IntA04', '')
    await fs.ensureDir(path.join(pluginDir, 'extend', 'bajo', 'intl'))
    await fs.writeJson(path.join(pluginDir, 'extend', 'bajo', 'intl', 'en-US.json'), { hello: 'Hello %s' })
  })

  afterEach(() => cleanupRoot(root))

  it('loads plugin translation file and translates text', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    expect(app.intA04Plugin.intl['en-US'].hello).to.equal('Hello %s')
    expect(app.t('intA04Plugin', 'hello', 'Joe')).to.equal('Hello Joe')
  })
})
