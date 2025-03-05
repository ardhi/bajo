import readAllConfigs from '../../../lib/read-all-configs.js'
import defaultsDeep from '../method/defaults-deep.js'
import getKeyByValue from '../method/get-key-by-value.js'
import resolvePath from '../method/resolve-path.js'
import currentLoc from '../../../lib/current-loc.js'
import envs from '../method/envs.js'
import join from '../method/join.js'
import omitDeep from 'omit-deep'
import os from 'os'
import fs from 'fs-extra'

import lodash from 'lodash'
const { map, pick, values, keys, set, get } = lodash

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

const defConfig = {
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    applet: false,
    traceHook: false
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  intl: {
    supported: ['en-US', 'id'],
    fallback: 'en-US',
    lookupOrder: [],
    format: {
      emptyValue: '',
      datetime: { dateStyle: 'medium', timeStyle: 'short' },
      date: { dateStyle: 'medium' },
      time: { timeStyle: 'short' },
      float: { maximumFractionDigits: 2 },
      integer: {}
    }
  },
  exitHandler: true
}

export async function buildBaseConfig () {
  this.applet = this.app.argv._.applet
  this.config = defaultsDeep({}, this.app.env._, this.app.argv._)
  this.alias = this.name
  set(this, 'dir.base', this.app.cwd)
  const path = currentLoc(import.meta).dir + '/../../../..'
  set(this, 'dir.pkg', resolvePath(path))
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = resolvePath(this.dir.data)
  if (!this.dir.tmp) {
    this.dir.tmp = `${resolvePath(os.tmpdir())}/${this.name}`
    fs.ensureDirSync(this.dir.tmp)
  }
  this.app.addPlugin(this)
}

export async function buildExtConfig () {
  // config merging
  let resp = await readAllConfigs.call(this.app, `${this.dir.data}/config/${this.name}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler', 'env']), omitted)
  this.config = defaultsDeep({}, resp, this.config, defConfig)
  this.config.env = (this.config.env ?? 'dev').toLowerCase()
  if (values(envs).includes(this.config.env)) this.config.env = getKeyByValue(envs, this.config.env)
  if (!keys(envs).includes(this.config.env)) throw new Error(`Unknown environment '${this.config.env}'. Supported: ${join(keys(envs))}`)
  process.env.NODE_ENV = envs[this.config.env]
  if (!this.config.log.level) this.config.log.level = this.config.env === 'dev' ? 'debug' : 'info'
  if (this.config.silent) this.config.log.level = 'silent'
  if (this.applet) {
    if (!this.pluginPkgs.includes('bajo-cli')) throw new Error('Applet needs to have \'bajo-cli\' loaded first')
    if (!this.config.log.applet) this.config.log.level = 'silent'
    this.config.exitHandler = false
  }
  const exts = map(this.configHandlers, 'ext')
  this.initPrint()
  this.initLog()
  this.log.debug('configHandlers%s', join(exts))
}
