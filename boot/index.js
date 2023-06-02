const config = require('./config')
const helper = require('./helper')

module.exports = async function () {
  const scope = require('./scope')()
  await config.call(scope)
  await helper.call(scope)
  return scope
}
