import yargs from 'yargs'
import { Parser } from 'yargs/helpers'
import { unflatten } from 'flat'
import dotenvParseVariables from 'dotenv-parse-variables'
import importModule from './import-module.js'
import lodash from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import currentLoc from './current-loc.js'

const { find, each, set, camelCase, forOwn } = lodash

const parseItem = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true
  })
}

const parseWithParser = async () => {
  return Parser(process.argv.slice(2), {
    configuration: {
      'camel-case-expansion': false
    }
  })
}

const parseWithYargs = async () => {
  const parser = './app/bajo/argv-parser.js'
  const mod = await importModule(parser)
  if (mod) return await mod(yargs)
  const pkg = fs.readJSONSync(`${currentLoc(import.meta).dir}/../../package.json`)
  let name = `node ${pkg.main}`
  if (pkg.bin) name = path.basename(pkg.bin, '.js')
  const cli = yargs(process.argv.slice(2))
    .usage('Usage: $0 [args...]')
    .scriptName(name)
    .positional('args', {
      describe: 'Optional one or more arguments'
    })
    .parserConfiguration({
      'camel-case-expansion': false
    })
    .version().alias('version', 'v')
    .help().alias('help', 'h')
    .alias('applet', 'a')
  if (pkg.homepage) cli.epilog(`For more information please visit ${pkg.homepage}`)
  return cli.argv
}

async function parseArgsArgv ({ delimiter = '-', splitter = ':', useParser } = {}) {
  if (!useParser) useParser = find(process.argv, a => a.startsWith('--spawn'))
  let argv = useParser ? await parseWithParser() : await parseWithYargs()
  const args = argv._
  delete argv._
  delete argv.$0
  argv = dotenvParseVariables(argv)
  const all = { _: {} }
  each(argv, (v, k) => {
    const parts = k.split(splitter)
    if (!parts[1]) all._[parts[0]] = v
    else set(all, `${camelCase(parts[0])}.${parts[1]}`, v)
  })
  const result = {}
  forOwn(all, (v, k) => {
    result[k] = parseItem(v, delimiter)
  })
  return { args, argv: result }
}

export default parseArgsArgv
