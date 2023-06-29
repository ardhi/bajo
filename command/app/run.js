import isValidApp from '../../helper/is-valid-app.js'
import pathResolve from '../../helper/path-resolve.js'
import globalModulesPath from 'global-modules-path'
import boot from '../../boot/index.js'
import _ from 'lodash'

const run = {
  command: 'run [appname]',
  aliases: ['r'],
  describe: 'Run application. If you left "appname" empty, it will try to boot up your current folder as if it\'s the app root folder.',
  async handler (argv) {
    let cwd = pathResolve.handler(process.cwd())
    if (!_.isEmpty(argv.appname)) cwd = globalModulesPath.getPath(argv.appname)
    if (!cwd) return console.error(`Unknown bajo app: "${argv.appname}". Try "bajo app list" to list all installed app.`)
    if (!isValidApp.handler(cwd)) return console.error('Current directory is NOT a valid bajo app, sorry!')
    await boot(cwd)
  }
}

export default run
