import readAllConfigs from '../../lib/read-all-configs.js'
import currentLoc from '../../lib/current-loc.js'
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
      double: { maximumFractionDigits: 5 },
      smallint: {},
      integer: {}
    },
    unitSys: {
      'en-US': 'imperial',
      id: 'metric'
    }
  },
  exitHandler: true
}

export async function buildBaseConfig () {
  const { defaultsDeep } = this.lib.aneka
  this.applet = this.app.argv._.applet
  this.config = defaultsDeep({}, this.app.env._, this.app.argv._)
  this.alias = this.name
  set(this, 'dir.base', this.app.dir)
  const path = currentLoc(import.meta).dir + '/../../..'
  set(this, 'dir.pkg', this.resolvePath(path))
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = this.resolvePath(this.dir.data)
  if (!fs.existsSync(this.dir.data)) {
    console.log('Data directory (%s) doesn\'t exist yet', this.dir.data)
    process.exit(1)
  }
  fs.ensureDirSync(`${this.dir.data}/config`)
  if (!this.dir.tmp) {
    this.dir.tmp = `${this.resolvePath(os.tmpdir())}/${this.name}`
    fs.ensureDirSync(this.dir.tmp)
  }
  this.app.addPlugin(this)
}

export async function buildExtConfig () {
  // config merging
  const { defaultsDeep } = this.lib.aneka
  let resp = await readAllConfigs.call(this.app, `${this.dir.data}/config/${this.name}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler', 'env']), omitted)
  this.config = defaultsDeep({}, resp, this.config, defConfig)
  this.config.env = (this.config.env ?? 'dev').toLowerCase()
  if (values(this.envs).includes(this.config.env)) this.config.env = this.lib.aneka.getKeyByValue(this.envs, this.config.env)
  if (!keys(this.envs).includes(this.config.env)) throw new Error(`Unknown environment '${this.config.env}'. Supported: ${this.join(keys(this.envs))}`)
  process.env.NODE_ENV = this.envs[this.config.env]
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
  this.log.debug('configHandlers%s', this.join(exts))
  this.config = this.parseObject(this.config, { parseValue: true })
}
