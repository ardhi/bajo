import mri from 'mri'
import flat from 'flat'
import dotenvParseVariables from 'dotenv-parse-variables'
import _ from 'lodash'
const { unflatten } = flat

const parse = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true,
  })
}

export default function (delimiter = '-', splitter = '--') {
  let argv = mri(process.argv.slice(2), {
    alias: {
      d: 'data-dir'
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
