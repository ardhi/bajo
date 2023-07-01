#!/usr/bin/env node
import { commands } from './command/index.js'
import epilog from './lib/epilog.js'
import yargs from 'yargs'

yargs(process.argv.slice(2))
  .scriptName('bajo')
  .usage('Usage: $0 <command>')
  .version().alias('version', 'v')
  .command(commands)
  .demandCommand(1, 'Please provide your command')
  .help().alias('help', 'h')
  .epilog(epilog)
  .strictCommands()
  .argv
