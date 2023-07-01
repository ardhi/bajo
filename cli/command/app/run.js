import isValidApp from '../../../boot/helper/is-valid-app.js'
import pathResolve from '../../../boot/helper/path-resolve.js'
import getGlobalModuleDir from '../../../boot/helper/get-global-module-dir.js'
import boot from '../../../boot/index.js'
import epilog from '../../lib/epilog.js'
import _ from 'lodash'

const run = {
  command: 'run [name]',
  aliases: ['r'],
  describe: 'Run named app. Omit [name] for local app',
  builder (yargs) {
    yargs.epilog(epilog)
  },
  async handler (argv) {
    let cwd = pathResolve.handler(process.cwd())
    if (!_.isEmpty(argv.name)) cwd = getGlobalModuleDir.handler(argv.name)
    if (!cwd) return console.error(`Unknown bajo app: '${argv.name}'. Try 'bajo app list' to list all installed app.`)
    if (!isValidApp.handler(cwd)) return console.error('Current directory is NOT a valid bajo app, sorry!')
    await boot(cwd)
  }
}

export default run
