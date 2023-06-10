const { EventEmitter } = require('events')
const _ = require('lodash')
const levels = require('../helper/log-levels')
const event = new EventEmitter()

const bajo = {
  event
}

module.exports = function () {
  return { bajo }
}
