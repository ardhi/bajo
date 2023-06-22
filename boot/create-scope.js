/**
 * @module boot/createScope
 */

import { EventEmitter } from 'events'
import _ from 'lodash'
import readJson from '../helper/read-json.js'
import importModule from '../helper/import-module.js'

const event = new EventEmitter()

async function defHandler (file) {
  let mod = await importModule.handler(file)
  if (_.isFunction(mod)) mod = await mod.call(this)
  return mod
}

const configHandlers = { '.js': defHandler, '.mjs': defHandler, '.json': readJson.handler }

const bajo = {
  event,
  configHandlers
}

/**
 * @instance
 * @async
 * @returns {Object} scope
 */

function createScope () {
  return { bajo }
}

export default createScope
