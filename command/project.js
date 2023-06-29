import buildCliSubcommand from '../lib/build-cli-subcommand.js'

import * as commands from './project/index.js'
import _ from 'lodash'

const project = buildCliSubcommand({
  command: 'project <action>',
  aliases: ['p'],
  describe: 'Bajo project builder',
  commands
})

export default project
