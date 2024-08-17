import { get, isFunction } from 'lodash-es'

function getMethod (name = '', thrown = true) {
  const { ns, path } = this.breakNsPath(name)
  const method = get(this.app, `${ns}.${path}`)
  if (method && isFunction(method)) return method
  if (thrown) throw this.error('Can\'t find method named \'%s\'', name)
}

export default getMethod
