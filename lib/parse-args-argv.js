import yargs from 'yargs'
import { Parser } from 'yargs/helpers'
import { unflatten } from 'flat'
import dotenvParseVariables from 'dotenv-parse-variables'
import lodash from 'lodash'
import fs from 'fs-extra'
import path from 'path'

const { find, each, set, camelCase, forOwn } = lodash
const delimiter = '-'
const splitter = ':'

const parseItem = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true
  })
}

async function parseWithParser () {
  return Parser(process.argv.slice(2), {
    configuration: {
      'camel-case-expansion': false
    }
  })
}

async function parseWithYargs () {
  const pkg = fs.readJSONSync(`${this.dir}/package.json`)
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
    .version(pkg.version).alias('version', 'v')
    .help().alias('help', 'h')
    .alias('applet', 'a')
  if (pkg.homepage) cli.epilog(`For more information please visit ${pkg.homepage}`)
  return cli.argv
}

/**
 * Parse program arguments (args) & options (argv). See {@link App#args|args} & {@link App#argv|argv} for examples
 *
 * @method
 * @async
 * @memberof module:Lib
 * @param {boolean} [useParser] - If ```true```, skip {@link https://github.com/yargs/yargs|yargs}
 * @returns {{args: Array, argv: Object}} An object containing ```args``` and ```argv```
 * @see App#args
 * @see App#argv
 */
async function parseArgsArgv (useParser) {
  if (!useParser) useParser = find(process.argv, a => a.startsWith('--spawn'))
  let argv = useParser ? await parseWithParser.call(this) : await parseWithYargs.call(this)
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
  return { args, argv: this.bajo.parseObject(result, { parseValue: true }) }
}

export default parseArgsArgv
