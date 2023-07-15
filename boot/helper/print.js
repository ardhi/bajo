import bora from '../lib/bora.js'
import Sprintf from 'sprintf-js'
import _ from 'lodash'
import defaultsDeep from './defaults-deep.js'
import getPluginName from './get-plugin-name.js'

const { sprintf } = Sprintf

function prep (args) {
  let opts = { type: 'bora', exit: false, skipSilent: false }
  const last = _.last(args)
  if (_.isPlainObject(last)) opts = defaultsDeep(args.pop(), opts)
  let [ns, msg, ...params] = args
  if (ns === 'bajo') ns = 'bajoI18N'
  opts.ns = ns
  return { ns, msg, params, opts }
}

function format (...args) {
  const { ns, msg, params } = prep(args)
  if (!msg) return ''
  const i18n = _.get(this, 'bajoI18N.instance')
  if (i18n) return i18n.t(msg, { ns, postProcess: 'sprintf', sprintf: params })
  return sprintf(msg, ...params)
}

const print = {
  format: function (...args) {
    const [msg, ...params] = args
    const ns = getPluginName.call(this, 2)
    return format.call(this, ns, msg, ...params)
  },
  fail: function (...args) {
    args.unshift(getPluginName.call(this, 2))
    const { ns, opts, msg, params } = prep(args)
    if (msg) {
      if (opts.type === 'bora') bora.call(this, ns, opts).fail(msg, ...params)
      else console.error(format.call(this, ns, msg, ...params))
    }
    if (opts.exit) process.exit(1)
  },
  succeed: function (...args) {
    args.unshift(getPluginName.call(this, 2))
    const { ns, opts, msg, params } = prep(args)
    if (msg) {
      if (opts.type === 'bora') bora.call(this, ns, opts).succeed(msg, ...params)
      else console.log(format.call(this, ns, msg, ...params))
    }
    if (opts.exit) process.exit(0)
  },
  warn: function (...args) {
    args.unshift(getPluginName.call(this, 2))
    const { ns, opts, msg, params } = prep(args)
    if (msg) {
      if (opts.type === 'bora') bora.call(this, ns, opts).warn(msg, ...params)
      else console.log(format.call(this, ns, msg, ...params))
    }
    if (opts.exit) process.exit(0)
  },
  info: function (...args) {
    args.unshift(getPluginName.call(this, 2))
    const { ns, opts, msg, params } = prep(args)
    if (msg) {
      if (opts.type === 'bora') bora.call(this, ns, opts).info(msg, ...params)
      else console.log(format.call(this, ns, msg, ...params))
    }
    if (opts.exit) process.exit(0)
  },
  fatal: function (...args) {
    args.unshift(getPluginName.call(this, 2))
    const { ns, opts, msg, params } = prep(args)
    if (msg) {
      if (opts.type === 'bora') bora.call(this, ns, opts).fatal(msg, ...params)
      else console.error(format.call(this, ns, msg, ...params))
    }
    process.exit(0)
  },
  bora: function (...args) {
    let ns = getPluginName.call(this, 2)
    if (ns === 'bajo') ns = 'bajoI18N'
    return bora.call(this, ns, ...args)
  }
}

export default print
