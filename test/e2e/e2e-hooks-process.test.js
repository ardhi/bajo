/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'
import { expect } from 'chai'
import { runNode } from './_run.js'

describe('e2e hooks process', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-e2e-hooks-'))
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('executes real plugin hooks in separate process', async function () {
    this.timeout(20000)

    const entry = pathToFileURL(path.join('/mnt/d/Projects/Bajo/bajo', 'index.js')).href
    const pluginName = 'e2e-plugin-hooks'
    const pdir = path.join(root, 'node_modules', pluginName)

    await fs.ensureDir(path.join(pdir, 'extend', 'bajo', 'hook'))
    await fs.writeJson(path.join(root, 'package.json'), { name: 'e2e-app', type: 'module', bajo: { plugins: [pluginName] } })
    await fs.writeJson(path.join(pdir, 'package.json'), { name: pluginName, version: '1.0.0', type: 'module', main: 'index.js', bajo: { appletSupport: true } })
    await fs.writeFile(path.join(pdir, 'index.js'), `
async function factory (pkgName) {
  const me = this
  return class E2EPluginHooks extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }
  }
}
export default factory
`, 'utf8')

    await fs.writeFile(path.join(pdir, 'extend', 'bajo', 'hook', 'bajo@after-boot.js'), `
export default {
  level: 1,
  handler: async function () {
    await this.app.lib.fs.writeFile(this.app.dir + '/e2e-hook.txt', 'done', 'utf8')
  }
}
`, 'utf8')

    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'data', 'config', 'bajo.json'), { log: { level: 'silent', save: false }, exitHandler: false, cache: { purgeIntvDur: '1h' } })

    await fs.writeFile(path.join(root, 'run-app.mjs'), `
import boot from ${JSON.stringify(entry)}
await boot({ cwd: process.cwd() })
console.log('HOOK_OK')
process.exit(0)
`, 'utf8')

    const res = await runNode(root, 'run-app.mjs')
    expect(res.timedOut).to.equal(false)
    expect(res.code).to.equal(0)
    expect(res.stdout).to.include('HOOK_OK')
    expect(fs.existsSync(path.join(root, 'e2e-hook.txt'))).to.equal(true)
  })
})
