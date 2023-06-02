const path = require('path')
const pathResolve = require('./path-resolve')
const _ = require('lodash')
const fg = require('fast-glob')
const jsHandler = async function (file) {
  let config = require(file)
  if (_.isFunction(config)) config = await config.call(this)
  return config
}

module.exports = async function (file, { pattern, globOptions = {} } = {}) {
  file = pathResolve.handler(file)
  let ext = path.extname(file)
  const fname = path.dirname(file) + '/' + path.basename(file, ext)
  ext = ext.toLowerCase()
  if (ext === '.js') return await jsHandler.call(this, file)
  const handlers = [
    { ext: '.json', handler: require },
    { ext: '.js', handler: jsHandler }
  ]
  if (this.bajoConfig) {
    _.forOwn(this.bajoConfig.helper, (v, k) => {
      handlers.push({ scoped: true, ext: key, handler: v })
    })
  }
  if (!['', '.*'].includes(ext)) {
    const handler = _.find(handlers, { ext })
    if (!handler) throw new Error('noHandlerFor' + _.upperFirst(ext.slice(1)))
    return handler(file)
  }
  const exts = _.map(handlers, h => h.ext.slice(1)).join(',')
  const item = pattern || `${fname}.{${exts}}`
  const files = await fg(item, globOptions)
  if (files.length === 0) throw new Error('noConfigFileFound')
  let config = {}
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    const item = _.find(handlers, { ext })
    if (!item) continue
    config = await item.handler.call(this, f)
  }
  return config
}
