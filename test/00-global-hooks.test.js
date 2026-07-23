/* global beforeEach, afterEach */

const state = {
  originalSetInterval: null,
  createdIntervals: [],
  listenerCounts: null
}

beforeEach(() => {
  state.createdIntervals = []
  state.listenerCounts = {
    SIGINT: process.listeners('SIGINT').length,
    SIGTERM: process.listeners('SIGTERM').length,
    beforeExit: process.listeners('beforeExit').length,
    uncaughtException: process.listeners('uncaughtException').length,
    unhandledRejection: process.listeners('unhandledRejection').length,
    warning: process.listeners('warning').length
  }

  if (!state.originalSetInterval) state.originalSetInterval = global.setInterval
  global.setInterval = (fn, delay, ...args) => {
    const id = state.originalSetInterval(fn, delay, ...args)
    state.createdIntervals.push(id)
    return id
  }
})

afterEach(() => {
  if (state.originalSetInterval) {
    global.setInterval = state.originalSetInterval
  }
  for (const id of state.createdIntervals) {
    clearInterval(id)
  }

  for (const event of Object.keys(state.listenerCounts)) {
    const listeners = process.listeners(event)
    const keep = state.listenerCounts[event]
    if (listeners.length <= keep) continue
    for (const listener of listeners.slice(keep)) {
      process.removeListener(event, listener)
    }
  }
})
