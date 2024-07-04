import os from 'os'
import fs from 'fs-extra'
import { get, set, pick, values, keys, uniq, without, filter, map, isEmpty, trim } from 'lodash-es'
import omitDeep from 'omit-deep'
import resolvePath from '../helper/resolve-path.js'
import readConfig from '../helper/read-config.js'
import getKeyByValue from '../helper/get-key-by-value.js'
import envs from '../helper/envs.js'
import defaultsDeep from '../helper/defaults-deep.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import error from '../helper/error.js'
import currentLoc from '../helper/current-loc.js'

const configFilePick = ['log', 'plugins', 'env', 'run', 'exitHandler']
const configFileOmit = ['tool', 'spawn', 'cwd', 'name', 'alias']

const defConfig = {
  dir: {},
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    report: [],
    tool: false
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  plugins: ['main'],
  env: 'dev',
  tool: false,
  exitHandler: true
}

async function buildConfig (cwd) {
  const { args, argv } = await parseArgsArgv()
  const env = parseEnv()
  const envArgv = defaultsDeep({}, env.root, argv.root)
  envArgv.name = 'bajo'
  envArgv.alias = 'bajo'
  // directories
  set(envArgv, 'dir.base', cwd)
  set(envArgv, 'dir.pkg', resolvePath(currentLoc(import.meta).dir + '/..'))
  if (!get(envArgv, 'dir.data')) set(envArgv, 'dir.data', `${envArgv.dir.base}/data`)
  envArgv.dir.data = resolvePath(envArgv.dir.data)
  if (!envArgv.dir.tmp) {
    envArgv.dir.tmp = resolvePath(os.tmpdir()) + '/bajo'
    fs.ensureDirSync(envArgv.dir.tmp)
  }
  // config merging
  let resp = await readConfig.call(this.bajo, `${envArgv.dir.data}/config/bajo.*`, { ignoreError: true })
  resp = omitDeep(pick(resp, configFilePick), configFileOmit)
  const config = defaultsDeep({}, envArgv, resp, defConfig)
  // force init
  config.args = args
  config.env = config.env.toLowerCase()
  if (values(envs).includes(config.env)) config.env = getKeyByValue(envs, config.env)
  if (!keys(envs).includes(config.env)) config.env = 'dev'
  process.env.NODE_ENV = envs[config.env]
  if (!config.log.level) config.log.level = config.env === 'dev' ? 'debug' : 'info'
  if (config.silent) config.log.level = 'silent'
  // sanitize plugins
  config.plugins = without(config.plugins, 'main')
  config.plugins.push('main')
  config.plugins = filter(uniq(map(config.plugins, b => trim(b))), b => !isEmpty(b))
  if (config.tool) {
    if (!config.plugins.includes('bajo-cli')) throw error('Sidetool needs to have \'bajo-cli\' package loaded first')
    if (!config.log.tool) config.log.level = 'silent'
    config.exitHandler = false
  }
  this.bajo.config = config
  this.bajo.log.init()
}

export default buildConfig
