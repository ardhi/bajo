import _ from 'lodash'
import dirNameCheck from './lib/dir-name-check.js'
import interactive from './create-app/interactive.js'
import withTpl from './create-app/with-tpl.js'
import epilog from '../../lib/epilog.js'

const createApp = {
  command: 'create-app <name> [tpl]',
  aliases: ['ca'],
  describe: `Create app project`,
  builder (yargs) {
    yargs.positional('name', {
      describe: 'Any valid npm name',
      type: 'string'
    })
    yargs.positional('tpl', {
      describe: `Template to use. Omit it for interactive session. Type: 'bajo project tpl app' for list`,
      type: 'string'
    })
    yargs.epilog(epilog)
    yargs.option('check-remote', {
      describe: 'Check npm repository for package existence',
      type: 'boolean'
    })
  },
  async handler (argv) {
    const cwd = await dirNameCheck(argv)
    const type = 'app'
    if (argv.tpl) await withTpl({ argv, cwd, type })
    else await interactive({ argv, cwd, type })
  }
}

export default createApp
