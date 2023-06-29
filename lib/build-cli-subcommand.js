import _ from 'lodash'

function buildCliSubcommand ({ command, aliases, describe, commands }) {
  const item = {
    command,
    aliases,
    describe,
    builder (yargs) {
      _.map(commands, cmd => yargs.command(cmd))
    },
    async handler (argv) {
      const cmds = _.keys(commands)
      if (!cmds.includes(argv.action))
        console.error(`Invalid action '${argv.action}'. Please only use one of these: ${cmds.join(', ')}`)
    }
  }
  return item
}

export default buildCliSubcommand
