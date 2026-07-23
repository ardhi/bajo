/* global describe, it, beforeEach, afterEach */

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'
import { expect } from 'chai'
import { runNode } from './_run.js'

describe('e2e boot process', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join('/tmp', 'bajo-e2e-boot-'))
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('boots real app in separate process and runs plugin start', async function () {
    this.timeout(20000)

    const entry = pathToFileURL(path.join('/mnt/d/Projects/Bajo/bajo', 'index.js')).href
    const pluginName = 'e2e-plugin-boot'
    const pdir = path.join(root, 'node_modules', pluginName)

    await fs.ensureDir(pdir)
    await fs.writeJson(path.join(root, 'package.json'), { name: 'e2e-app', type: 'module', bajo: { plugins: [pluginName] } })
    await fs.writeJson(path.join(pdir, 'package.json'), { name: pluginName, version: '1.0.0', type: 'module', main: 'index.js' })
    await fs.writeFile(path.join(pdir, 'index.js'), `
async function factory (pkgName) {
  const me = this
  return class E2EPluginBoot extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
      this.start = async () => {
        await this.app.lib.fs.writeFile(this.app.dir + '/e2e-boot.txt', 'started', 'utf8')
      }
    }
  }
}
export default factory
`, 'utf8')

    await fs.ensureDir(path.join(root, 'data', 'config'))
    await fs.writeJson(path.join(root, 'data', 'config', 'bajo.json'), { log: { level: 'silent', save: false }, exitHandler: false, cache: { purgeIntvDur: '1h' } })

    await fs.writeFile(path.join(root, 'run-app.mjs'), `
import boot from ${JSON.stringify(entry)}
const app = await boot({ cwd: process.cwd() })
console.log('BOOT_OK:' + !!app.getPlugin(${JSON.stringify(pluginName)}, true))
process.exit(0)
`, 'utf8')

    const res = await runNode(root, 'run-app.mjs')
    expect(res.timedOut).to.equal(false)
    expect(res.code).to.equal(0)
    expect(res.stdout).to.include('BOOT_OK:true')
    expect(fs.existsSync(path.join(root, 'e2e-boot.txt'))).to.equal(true)
  })
})
