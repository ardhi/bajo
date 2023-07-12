import ora from 'ora'
import Sprintf from 'sprintf-js'
import _ from 'lodash'
import defaultsDeep from './defaults-deep.js'

function prep (args, skipSilent) {
  const { getConfig } = this.bajo.helper
  const config = getConfig()
  let opts = { type: 'ora', exit: false }
  const last = _.last(args)
  if (_.isPlainObject(last)) opts = defaultsDeep(args.pop(), opts)
  if (config.silent && !skipSilent) return { opts }
  let msg = args.shift()
  if (_.isString(msg)) msg = { text: msg }
  msg.text = Sprintf.sprintf(msg.text, ...args)
  return { msg, opts }
}

const print = {
  fail: function (...args) {
    const { opts, msg } = prep.call(this, args)
    if (msg) {
      if (opts.type === 'ora') ora(msg).fail()
      else console.error(msg.text)
    }
    if (opts.exit) process.exit(1)
  },
  succeed: function (...args) {
    const { opts, msg } = prep.call(this, args)
    if (msg) {
      if (opts.type === 'ora') ora(msg).succeed()
      else console.log(msg.text)
    }
    if (opts.exit) process.exit(0)
  },
  warn: function (...args) {
    const { opts, msg } = prep.call(this, args)
    if (msg) {
      if (opts.type === 'ora') ora(msg).warn()
      else console.log(msg.text)
    }
    if (opts.exit) process.exit(0)
  },
  info: function (...args) {
    const { opts, msg } = prep.call(this, args)
    if (msg) {
      if (opts.type === 'ora') ora(msg).info()
      else console.log(msg.text)
    }
    if (opts.exit) process.exit(0)
  },
  fatal: function (...args) {
    const { opts, msg } = prep.call(this, args, true)
    if (opts.type === 'ora') ora(msg).fail()
    else console.error(msg.text)
    process.exit(0)
  },
  ora: function (msg, ...args) {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (_.isString(msg)) msg = { text: msg }
    let opts = {}
    if (_.isPlainObject(_.last(args))) opts = args.pop()
    if (config.silent && !opts.forceShown) msg.isSilent = true
    msg.text = Sprintf.sprintf(msg.text, ...args)
    const instance = ora(msg)
    return instance
  }
}

export default print
