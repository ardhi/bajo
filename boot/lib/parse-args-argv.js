import yargs from 'yargs'
import { Parser } from 'yargs/helpers'
import flat from 'flat'
import isSet from '../helper/is-set.js'
import dotenvParseVariables from 'dotenv-parse-variables'
import importModule from '../helper/import-module.js'
import { find, each, set, camelCase, forOwn } from 'lodash-es'
import fs from 'fs-extra'
import currentLoc from '../helper/current-loc.js'

const { unflatten } = flat

const parseItem = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true,
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
  if (fs.existsSync(parser)) {
    const mod = await importModule(parser)
    return await mod(yargs)
  }
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
    .alias('tool', 't')
    if (pkg.homepage) cli.epilog(`For more information please visit ${pkg.homepage}`)
  return cli.argv
}

async function parseArgsArgv ({ delimiter = '-', splitter = '--', useParser } = {}) {
  if (!isSet(useParser)) useParser = find(process.argv, a => a.startsWith('--spawn'))
  let argv = useParser ? await parseWithParser() : await parseWithYargs()
  const args = argv._
  delete argv._
  delete argv.$0
  argv = dotenvParseVariables(argv)

  const all = { root: {} }
  each(argv, (v, k) => {
    const parts = k.split(splitter)
    if (!parts[1]) all.root[parts[0]] = v
    else set(all, `${camelCase(parts[0])}.${parts[1]}`, v)
  })
  const result = {}
  forOwn(all, (v, k) => {
    result[k] = parseItem(v, delimiter)
  })
  return { args, argv: result }
}

export default parseArgsArgv
