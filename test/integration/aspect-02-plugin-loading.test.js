/* global describe, it, beforeEach, afterEach */

import { expect } from 'chai'
import boot from '../../index.js'
import { makeRoot, cleanupRoot, writeBaseApp, writePlugin } from './_setup.js'

describe('integration aspect 02 - plugin loading', () => {
  let root

  beforeEach(async () => {
    root = makeRoot('bajo-int-a02-')
    await writeBaseApp(root, 'int-a02-plugin')
    await writePlugin(root, 'int-a02-plugin', 'IntA02', "this.state.started = true")
  })

  afterEach(() => cleanupRoot(root))

  it('loads plugin and keeps namespace mapping', async function () {
    this.timeout(12000)
    const app = await boot({ cwd: root })
    expect(app.intA02Plugin).to.be.an('object')
    expect(app.getAllNs()).to.include('intA02Plugin')
  })
})
