import buildCliSubcommand from '../lib/build-cli-subcommand.js'

import * as commands from './app/index.js'
import _ from 'lodash'

const project = buildCliSubcommand({
  command: 'app <action>',
  aliases: ['a'],
  describe: 'Bajo application management',
  commands
})

export default project
