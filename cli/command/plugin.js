import buildCliSubcommand from '../lib/build-sub-command.js'
import { commands } from './plugin/index.js'
import _ from 'lodash'

export const usage = 'Bajo plugin is a regular npm package with custom structure. You can install globaly ' +
  `through 'npm install -g <name>'. By installing as a global package, you can import and use it like any ` +
  'local packages with extra benefits: no more worries about local package install & upgrade. Also, ' +
  'all commands listed below are only applicable for globaly installed plugins'

const plugin = buildCliSubcommand({
  command: 'plugin <action>',
  aliases: ['a'],
  describe: 'Plugins manager',
  commands
})

export default plugin
