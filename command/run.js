import isValidApp from '../helper/is-valid-app.js'
import pathResolve from '../helper/path-resolve.js'
import globalModulesPath from 'global-modules-path'
import boot from '../boot/index.js'

const run = {
  command: 'run [app]',
  describe: 'Running current app (if no option given) or installed app',
  builder: {
    app: {
      default: 'app'
    }
  },
  async handler (argv) {
    let cwd = pathResolve.handler(process.cwd())
    if (argv.app !== 'app') cwd = globalModulesPath.getPath(argv.app)
    if (!isValidApp.handler(cwd)) return console.error('Current directory is NOT a valid bajo app, sorry!')
    await boot(cwd)
  }
}

export default run
