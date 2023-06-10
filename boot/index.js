const config = require('./config')
const bootOrder = require('./boot-order')
const helper = require('./helper')
const bajos = require('./bajos')
const sysReport = require('./sys-report')
const exitHandler = require('./exit-handler')
require('replaceall-shim')

module.exports = async function () {
  const scope = require('./scope')()
  await config.call(scope)
  await helper.call(scope)
  await sysReport.call(scope)
  await bootOrder.call(scope)
  await bajos.call(scope)
  await exitHandler.call(scope)
  return scope
}
