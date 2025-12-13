/**
 * Async/await wrapper for setImmediate
 *
 * @method
 * @memberof module:Lib
 * @returns
 */

async function setImmediate () {
  return new Promise((resolve) => {
    setImmediate(() => resolve())
  })
}

export default setImmediate
