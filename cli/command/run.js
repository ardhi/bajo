import buildCliSubcommand from '../lib/build-sub-command.js'
import run from './app/run.js'
import _ from 'lodash'

const project = buildCliSubcommand({
  command: 'run [name]',
  aliases: ['r'],
  describe: `Shortcut for 'bajo app run'`,
  handler: run.handler
})

export default project
