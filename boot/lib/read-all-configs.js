import readConfig from '../class/bajo-core/method/read-config.js'
import defaultsDeep from '../class/bajo-core/method/defaults-deep.js'

async function readAllConfigs (base) {
  let cfg = {}
  let ext = {}
  // default config file
  try {
    cfg = await readConfig.call(this.bajo, `${base}.*`)
  } catch (err) {
    if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
  }
  // env based config file
  try {
    ext = await readConfig.call(this.bajo, `${base}-${this.bajo.config.env}.*`)
  } catch (err) {
    if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
  }
  return defaultsDeep({}, ext, cfg)
  /*
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
  */
}

export default readAllConfigs
