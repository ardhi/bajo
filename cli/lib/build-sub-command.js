import _ from 'lodash'
import epilog from './epilog.js'

function buildSubCommand ({ command, aliases, describe, commands, handler, example }) {
  if (!handler) {
    handler = async function (argv) {
      const cmds = _.keys(commands)
      if (!cmds.includes(argv.action))
        console.error(`Invalid action '${argv.action}'. Please only use one of these: ${cmds.join(', ')}`)
    }
  }
  const item = {
    command: command + ' [options]',
    aliases,
    describe,
    builder (yargs) {
      if (commands) _.map(commands, cmd => yargs.command(cmd))
      yargs.epilog(epilog)
      if (example) yargs.example(example)
    },
    handler
  }
  return item
}

export default buildSubCommand
