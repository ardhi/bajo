import isValidApp from '../../helper/is-valid-app.js'
import getGlobalModuleDir from '../../helper/get-global-module-dir.js'
import readJson from '../../helper/read-json.js'
import _ from 'lodash'

const info = {
  command: 'info <name>',
  aliases: ['i'],
  describe: 'Show detailed information about an application',
  async handler (argv) {
    try {
      const path = getGlobalModuleDir.handler(argv.name, false)
      if (!isValidApp.handler(path)) return console.log(`'${argv.name}' is an invalid bajo app`)
      const pkg = _.pick(readJson.handler(`${path}/package.json`), ['name', 'version', 'description', 'author', 'license', 'homepage'])
      console.log(pkg)
    } catch (err) {
      console.error(err.message)
    }
  }
}

export default info
