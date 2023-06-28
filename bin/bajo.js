#!/usr/bin/env node
import * as commands from '../command/index.js'
import yargs from 'yargs'
import _ from 'lodash'

const cli = yargs(process.argv.slice(2))
  .scriptName('bajo')
  .usage('Usage: $0 <command> [options]')
  .version()
  .demandCommand()
  .help()

_.map(commands, cmd => cli.command(cmd))

cli.argv
