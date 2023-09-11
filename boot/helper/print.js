import bora from '../lib/bora.js'
import Sprintf from 'sprintf-js'
import { last, isPlainObject, get, merge } from 'lodash-es'
import defaultsDeep from './defaults-deep.js'
import getPluginName from './get-plugin-name.js'

const { sprintf } = Sprintf

function prep (args) {
  let opts = { type: 'bora', exit: false, skipSilent: false }
  const l = last(args)
  if (isPlainObject(l)) opts = defaultsDeep(args.pop(), opts)
  const [pkg, msg, ...params] = args
  opts.pkg = pkg
  opts.ns = pkg === 'bajo' ? 'bajoI18N' : pkg
  return { ns: opts.ns, pkg, msg, params, opts }
}

function format (...args) {
  const { ns, msg, params, opts } = prep(args)
  if (!msg) return ''
  const i18n = get(this, 'bajoI18N.instance')
  if (i18n) {
    if (isPlainObject(params[0])) return i18n.t(msg, merge({}, params[0] ?? {}, { ns }))
    return i18n.t(msg, { ns, pkg: opts.pkg, postProcess: 'sprintf', sprintf: params })
  }
  return sprintf(msg, ...params)
}

const print = {
  __: function (...args) {
    const [msg, ...params] = args
    const pkg = getPluginName.call(this, 2)
    return format.call(this, pkg, msg, ...params)
  },
  _format: format,
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
