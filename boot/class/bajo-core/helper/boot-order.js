import lodash from 'lodash'
import fs from 'fs-extra'
import getModuleDir from '../method/get-module-dir.js'

const { reduce, map, isNaN, trim, forOwn, orderBy } = lodash

async function bootOrder () {
  this.log.debug('Setup boot order')
  const order = reduce(this.pluginPkgs, (o, k, i) => {
    const key = map(k.split(':'), m => trim(m))
    if (key[1] && !isNaN(Number(key[1]))) o[key[0]] = Number(key[1])
    else o[key[0]] = 10000 + i
    return o
  }, {})
  const norder = {}
  for (let n of this.pluginPkgs) {
    n = map(n.split(':'), m => trim(m))[0]
    const dir = n === this.mainNs ? (`${this.dir.base}/${this.mainNs}`) : getModuleDir(n)
    if (n !== this.mainNs && !fs.existsSync(`${dir}/bajo`)) throw this.error('Package \'%s\' not found or isn\'t a valid Bajo package', n)
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
  this.pluginPkgs = map(orderBy(result, ['v']), 'k')
  this.log.info('Run in \'%s\' environment', this.envs[this.config.env])
  // misc
  this.freeze(this.config)
}

export default bootOrder
