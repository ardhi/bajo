import path from 'path'

async function getItemByName (name) {
  const { resolvePath, readConfig, error } = this.app.bajo.helper
  const [type, ...paths] = name.split(':')
  let result
  switch (type) {
    case 'config': {
      let file = paths.join(':')
      if (!path.isAbsolute(file)) file = resolvePath(`${this.app.bajo.config.dir.data}/config/${file}`)
      result = await readConfig(file)
      break
    }
    case 'helper': {
      const [ns, fn] = paths.join(':').split('.')
      if (!(ns && fn)) throw error('Unknown helper \'%s.%s\'', ns, fn, { code: 'BAJO_UNKNOWN_HELPER' })
      result = this.app[ns].helper[fn]
      break
    }
    default: throw error('Unsupported type \'%s\'', type, { code: 'BAJO_UNSUPPORTED_TYPE' })
  }
  return result
}

export default getItemByName
