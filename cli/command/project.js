import buildCliSubcommand from '../lib/build-sub-command.js'
import { commands } from './project/index.js'
import _ from 'lodash'

export const usage = '...'

const project = buildCliSubcommand({
  command: 'project <action>',
  aliases: ['p'],
  describe: 'Project builder',
  commands
})

export default project
