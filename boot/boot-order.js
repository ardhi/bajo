import { reduce, map, isNaN, trim, forOwn, orderBy } from 'lodash-es'
import fs from 'fs-extra'
import getModuleDir from './helper/get-module-dir.js'
import error from './helper/error.js'

export default async function () {
  const { log, envs } = this.bajo.helper
  log.debug('Setup boot order')
  const config = this.bajo.config
  const order = reduce(config.plugins, (o, k, i) => {
    const key = map(k.split(':'), m => trim(m))
    if (key[1] && !isNaN(Number(key[1]))) o[key[0]] = Number(key[1])
    else o[key[0]] = 10000 + i
    return o
  }, {})
  const norder = {}
  for (let n of config.plugins) {
    n = map(n.split(':'), m => trim(m))[0]
    const dir = n === 'app' ? (config.dir.base + '/app') : getModuleDir(n)
    if (n !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error(`Package '%s' isn't a valid Bajo package`, n, { code: 'BAJO_INVALID_PACKAGE' })
    norder[n] = NaN
    try {
      norder[n] = Number(trim(await fs.readFile(`${dir}/bajo/.bootorder`, 'utf8')))
    } catch (err) {}
  }
  let result = []
  forOwn(order, (v, k) => {
    const item = { k, v: isNaN(norder[k]) ? v : norder[k]}
    result.push(item)
  })
  config.plugins = map(orderBy(result, ['v']), 'k')
  log.info(`Run in '%s' environment`, envs[config.env])
}
