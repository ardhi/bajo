import { get } from 'lodash-es'
import error from './error.js'
import breakNsPath from './break-ns-path.js'

function getHelper (name = '', thrown = true) {
  const [ns, method] = breakNsPath.call(this.app.bajo, name)
  const helper = get(this.app, `${ns}.helper.${method}`)
  if (helper) return helper
  if (thrown) throw error.call(this.app.bajo, 'Can\'t find helper named \'%s\'', name)
}

export default getHelper
