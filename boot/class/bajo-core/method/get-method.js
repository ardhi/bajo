import lodash from 'lodash'

const { get, isFunction } = lodash

function getMethod (name = '', thrown = true) {
  const { ns, path } = this.breakNsPath(name)
  const method = get(this.app, `${ns}.${path}`)
  if (method && isFunction(method)) return method
  if (thrown) throw this.error('cantFindMethod%s', name)
}

export default getMethod
