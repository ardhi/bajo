import { reduce, map, isNaN, trim, forOwn, orderBy } from 'lodash-es'
import fs from 'fs-extra'
import getModuleDir from '../helper/get-module-dir.js'

async function bootOrder () {
  const { envs, error } = this.bajo.helper
  this.bajo.log.debug('Setup boot order')
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
    const dir = n === 'main' ? (config.dir.base + '/main') : getModuleDir(n)
    if (n !== 'main' && !fs.existsSync(`${dir}/bajo`)) throw error('Package \'%s\' not found or isn\'t a valid Bajo package', n)
    norder[n] = NaN
    try {
      norder[n] = Number(trim(await fs.readFile(`${dir}/bajo/.bootorder`, 'utf8')))
    } catch (err) {}
  }
  const result = []
  forOwn(order, (v, k) => {
    const item = { k, v: isNaN(norder[k]) ? v : norder[k] }
    result.push(item)
  })
  config.plugins = map(orderBy(result, ['v']), 'k')
  this.bajo.log.info('Run in \'%s\' environment', envs[config.env])
}

export default bootOrder
