const dotenvParseVariables = require('dotenv-parse-variables')
const unflatten = require('flat').unflatten
const _ = require('lodash')

const parse = (data, delimiter) => {
  return unflatten(data, {
    delimiter,
    safe: true,
    overwrite: true,
    transformKey: k => k.toLowerCase()
  })
}

module.exports = function (delimiter = '_', splitter = '__') {
  let env
  try {
    env = require('dotenv').config()
    if (env.error) throw env.error
  } catch (err) {
    env = { parsed: {} }
  }
  env = dotenvParseVariables(env.parsed, { assignToProcessEnv: false })
  const all = { root: {} }
  _.each(env, (v, k) => {
    const parts = k.split(splitter)
    if (!parts[1]) all.root[parts[0]] = v
    else _.set(all, `${_.camelCase(parts[0])}.${parts[1]}`, v)
  })
  const result = {}
  _.forOwn(all, (v, k) => {
    result[k] = parse(v, delimiter)
  })
  return result
}
