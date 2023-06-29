import isValidPlugin from '../../helper/is-valid-plugin.js'
import getGlobalModuleDir from '../../helper/get-global-module-dir.js'
import readJson from '../../helper/read-json.js'
import _ from 'lodash'

const info = {
  command: 'info <name>',
  aliases: ['i'],
  describe: 'Show detailed information about a plugin',
  async handler (argv) {
    try {
      const path = getGlobalModuleDir.handler(argv.name, false)
      if (!isValidPlugin.handler(path)) return console.log(`'${argv.name}' is invalid bajo plugin`)
      const pkg = _.pick(readJson.handler(`${path}/package.json`), ['name', 'version', 'description', 'author', 'license', 'homepage'])
      console.log(pkg)
    } catch (err) {
      console.error(err.message)
    }
  }
}

export default info
