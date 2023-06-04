const path = require('path')
const pathResolve = require('./path-resolve')
const _ = require('lodash')
const error = require('./error')
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
  if (this.bajoExtra) {
    _.forOwn(this.bajoExtra.helper, (v, k) => {
      if (k.startsWith('readConfig')) {
        const key = _.last(_.kebabCase(k).split('-'))
        handlers.push({ scoped: true, ext: '.' + key, handler: v })
      }
    })
  }
  if (!['', '.*'].includes(ext)) {
    const handler = _.find(handlers, { ext })
    if (!handler) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    return handler(file)
  }
  const item = pattern || `${fname}.*`
  const files = await fg(item, globOptions)
  if (files.length === 0) throw error.handler('No config file found', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
  let config = {}
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    const item = _.find(handlers, { ext })
    if (!item) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    config = await item.handler.call(this, f)
  }
  return config
}
