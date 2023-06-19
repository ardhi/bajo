/**
 * Emit an event. Shortcut to ```this.bajo.event.emit()``` function
 *
 * @memberof module:helper
 * @instance
 * @async
 * @param {string} name - Event name
 * @param {Object} params - Event parameters/arguments
 */

function emit (name, ...params) {
  this.bajo.event.emit(name, ...params)
}

export default emit
