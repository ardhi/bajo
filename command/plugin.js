import buildCliSubcommand from '../lib/build-cli-subcommand.js'

import * as commands from './plugin/index.js'
import _ from 'lodash'

const plugin = buildCliSubcommand({
  command: 'plugin <action>',
  aliases: ['a'],
  describe: 'Bajo plugin management',
  commands
})

export default plugin
