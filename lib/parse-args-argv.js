const mri = require('mri')
const unflatten = require('flat').unflatten
const dotenvParseVariables = require('dotenv-parse-variables')
const _ = require('lodash')

const parse = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true,
  })
}

module.exports = function (delimiter = '-', splitter = '--') {
  let argv = mri(process.argv.slice(2), {
    boolean: ['dev', 'verbose'],
    string: ['data-dir', 'tmp-dir', 'log-details'],
    alias: {
      d: 'data-dir',
      v: 'verbose'
    }
  })
  const args = argv._
  delete argv._
  argv = dotenvParseVariables(argv)
  const all = { root: {} }
  _.each(argv, (v, k) => {
    const parts = k.split(splitter)
    if (!parts[1]) all.root[parts[0]] = v
    else _.set(all, `${_.camelCase(parts[0])}.${parts[1]}`, v)
  })
  const result = {}
  _.forOwn(all, (v, k) => {
    result[k] = parse(v, delimiter)
  })
  return { args, argv: result }
}
