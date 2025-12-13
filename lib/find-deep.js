import fs from 'fs'

/**
 * Find item deep in paths
 *
 * @method
 * @memberof module:Lib
 * @param {string} item - Item to find
 * @param {Array} paths - Array of path to look for
 * @returns {string}
 */
function findDeep (item, paths) {
  let dir
  for (const p of paths) {
    const d = `${p}/${item}`
    if (fs.existsSync(d)) {
      dir = d
      break
    }
  }
  return dir
}

export default findDeep
