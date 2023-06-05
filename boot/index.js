const config = require('./config')
const order = require('./order')
const helper = require('./helper')
const bajos = require('./bajos')

module.exports = async function () {
  const scope = require('./scope')()
  await config.call(scope)
  await order.call(scope)
  await helper.call(scope)
  await bajos.call(scope)
  return scope
}
