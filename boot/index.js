const config = require('./config')
const helper = require('./helper')
const bajos = require('./bajos')
require('log-timestamp')

module.exports = async function () {
  const scope = require('./scope')()
  await config.call(scope)
  await helper.call(scope)
  await bajos.call(scope)
  return scope
}
