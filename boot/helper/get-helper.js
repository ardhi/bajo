import { get } from 'lodash-es'
import error from './error.js'
import breakNsPath from './break-ns-path.js'

function getHelper (name = '', thrown = true) {
  const [plugin, method] = breakNsPath.call(this, name)
  const helper = get(this, `${plugin}.helper.${method}`)
  if (helper) return helper
  if (thrown) throw error.call(this, 'Can\'t find helper named \'%s\'', name)
}

export default getHelper
