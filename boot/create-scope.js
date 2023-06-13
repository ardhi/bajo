/**
 * @module boot/createScope
 */

const { EventEmitter } = require('events')
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

module.exports = createScope
