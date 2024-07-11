import { get } from 'lodash-es'
import error from './error.js'
import breakNsPath from './break-ns-path.js'

export default function (name = '', thrown = true) {
  const [ns, path] = breakNsPath.call(this.app.bajo, name)
  const method = get(this.app, `${ns}.${path}`)
  if (method) return method
  if (thrown) throw error.call(this.app.bajo, 'Can\'t find method named \'%s\'', name)
}
