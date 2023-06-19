/**
 * @module boot/createScope
 */

import { EventEmitter } from 'events'
const event = new EventEmitter()

const bajo = {
  event
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
