import path from 'node:path'
import fs from 'fs-extra'

export const makeRoot = (prefix = 'bajo-int-') => fs.mkdtempSync(path.join('/tmp', prefix))

export const cleanupRoot = (root) => {
  if (root) fs.rmSync(root, { recursive: true, force: true })
}

export const writeBaseApp = async (root, pluginName, extraBajoConfig = {}) => {
  await fs.writeJson(path.join(root, 'package.json'), {
    name: 'bajo-int-app',
    type: 'module',
    bajo: { plugins: [pluginName] }
  })

  await fs.ensureDir(path.join(root, 'data', 'config'))
  await fs.writeJson(path.join(root, 'data', 'config', 'bajo.json'), {
    env: 'dev',
    lang: 'en-US',
    exitHandler: false,
    log: { level: 'silent', save: false },
    cache: { purgeIntvDur: '1h' },
    ...extraBajoConfig
  })
}

export const writePlugin = async (root, pluginName, className = 'IntegrationPlugin', startBody = '') => {
  const pluginDir = path.join(root, 'node_modules', pluginName)
  await fs.ensureDir(pluginDir)
  await fs.writeJson(path.join(pluginDir, 'package.json'), {
    name: pluginName,
    version: '1.0.0',
    type: 'module',
    main: 'index.js',
    bajo: {
      appletSupport: true
    }
  })

  const code = `
async function factory (pkgName) {
  const me = this
  return class ${className} extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = { marker: 'ok', feature: true }
      this.start = async () => {
        ${startBody}
      }
    }
  }
}
export default factory
`
  await fs.writeFile(path.join(pluginDir, 'index.js'), code, 'utf8')
  return pluginDir
}
