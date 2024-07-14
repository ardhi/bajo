import readConfig from '../class/bajo-core/method/read-config.js'

async function readAllConfigs (base) {
  let cfg = {}
  try {
    cfg = await readConfig.call(this.bajo, `${base}-${this.bajo.config.env}.*`)
  } catch (err) {
    if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
    if (['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) {
      try {
        cfg = await readConfig.call(this.bajo, `${base}.*`)
      } catch (err) {
        if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
      }
    }
  }
  return cfg
}

export default readAllConfigs
