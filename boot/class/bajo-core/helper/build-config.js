import readAllConfigs from '../../../lib/read-all-configs.js'
import defaultsDeep from '../method/defaults-deep.js'
import getKeyByValue from '../method/get-key-by-value.js'
import envs from '../method/envs.js'
import join from '../method/join.js'
import omitDeep from 'omit-deep'

import { map, pick, values, keys } from 'lodash-es'

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

const defConfig = {
  dir: {},
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    applet: false,
    report: []
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  exitHandler: true
}

async function buildConfig () {
  // config merging
  let resp = await readAllConfigs.call(this.app, `${this.config.dir.data}/config/${this.name}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler']), omitted)
  this.config = defaultsDeep({}, this.config, resp, defConfig)
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
  this.log.init()
  this.log.debug('Config handlers: %s', join(exts))
}

export default buildConfig
