const fastGlob = require('fast-glob')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')

module.exports = async function (dir, { exclude = [] } = {}) {
  dir = pathResolve.handler(dir)
  exclude = _.map(exclude, e => `${dir}/${e}`)
  let files = await fastGlob(`${dir}/**/*.js`)
  files = _.without(files, ...exclude)
  const helper = {}
  _.each(files, f => {
    const base = f.replace(dir, '').replace('.js', '')
    const name = _.camelCase(base)
    let mod = require(f)
    if (_.isFunction(mod)) mod = mod.bind(this)
    else if (_.isPlainObject(mod)) {
      if (_.isFunction(mod.handler)) {
        mod = mod.noScope ? mod.handler : mod.handler.bind(this)
      } else if (_.isFunction(mod.class)) mod = new mod.class(this)
    }
    helper[name] = mod
  })

  return helper
}
