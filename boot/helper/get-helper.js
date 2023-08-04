import { get } from 'lodash-es'
import error from './error.js'

function getHelper (name = '', thrown = true) {
  const [plugin, method] = name.split(':')
  const helper = get(this, `${plugin}.helper.${method}`)
  if (helper) return helper
  if (thrown) throw error.call(this, 'Can\'t find helper named \'%s\'', name)
}

export default getHelper
