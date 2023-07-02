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
    yargs.option('check-remote', {
      describe: 'Check npm repository for package existence',
      type: 'boolean'
    })
    yargs.epilog(epilog)
  },
  async handler (argv) {
    const cwd = await dirNameCheck(argv)
    const type = 'app'
    const session = {}
    if (argv.tpl) await withTpl({ argv, cwd, type })
    else await interactive({ argv, cwd, type, session })
  }
}

export default createApp
