import { pick, values, keys, map } from 'lodash-es'
import omitDeep from 'omit-deep'
import readConfig from './helper/read-config.js'
import getKeyByValue from './helper/get-key-by-value.js'
import envs from './helper/envs.js'
import defaultsDeep from './helper/defaults-deep.js'
import error from './helper/error.js'
import join from './helper/join.js'

const configFilePick = ['log', 'plugins', 'env', 'run', 'exitHandler']
const configFileOmit = ['tool', 'spawn', 'cwd', 'name', 'alias']

const defConfig = {
  dir: {},
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    tool: false
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  env: 'dev',
  tool: false,
  exitHandler: true
}

async function buildConfig () {
  // config merging
  let resp = await readConfig.call(this.bajo, `${this.bajo.config.dir.data}/config/bajo.*`, { ignoreError: true })
  resp = omitDeep(pick(resp, configFilePick), configFileOmit)
  this.bajo.config = defaultsDeep({}, this.bajo.config, resp, defConfig)
  this.bajo.config.env = this.bajo.config.env.toLowerCase()
  if (values(envs).includes(this.bajo.config.env)) this.bajo.config.env = getKeyByValue(envs, this.bajo.config.env)
  if (!keys(envs).includes(this.bajo.config.env)) this.bajo.config.env = 'dev'
  process.env.NODE_ENV = envs[this.bajo.config.env]
  if (!this.bajo.config.log.level) this.bajo.config.log.level = this.bajo.config.env === 'dev' ? 'debug' : 'info'
  if (this.bajo.config.silent) this.bajo.config.log.level = 'silent'
  if (this.bajo.config.tool) {
    if (!this.bajo.config.plugins.includes('bajo-cli')) throw error('Sidetool needs to have \'bajo-cli\' package loaded first')
    if (!this.bajo.config.log.tool) this.bajo.config.log.level = 'silent'
    this.bajo.config.exitHandler = false
  }
  const exts = map(this.bajo.configHandlers, 'ext')
  this.bajo.log.debug('Config handlers: %s', join(exts))
}

export default buildConfig
