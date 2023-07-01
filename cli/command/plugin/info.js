import isValidPlugin from '../../../boot/helper/is-valid-plugin.js'
import getGlobalModuleDir from '../../../boot/helper/get-global-module-dir.js'
import readJson from '../../../boot/helper/read-json.js'
import epilog from '../../lib/epilog.js'
import _ from 'lodash'

const info = {
  command: 'info <name>',
  aliases: ['i'],
  describe: 'Show detailed info of <name>',
  builder (yargs) {
    yargs.epilog(epilog)
  },
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
