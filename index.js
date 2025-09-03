import App from './class/app.js'
import shim from './lib/shim.js'

shim()

/**
 * Main entry point of a Bajo app.
 *
 * Returned value is the app instance itself.
 *
 * You can code directly with it, but typically you code by writing inside main plugin or
 * writing custom plugin.
 *
 * I recommend the second method because of its portability.
 *
 * Example:
 * ```javascript
 * // index.js file. Ypur main package entry point
 * import bajo from 'bajo'
 * await bajo()
 * ```
 *
 * @global
 * @async
 * @see {@tutorial 01-getting-started}
 * @param {string} [cwd] - Current working directory
 * @returns {App}
 */
async function boot (cwd) {
  const app = new App(cwd)
  return await app.boot()
}

export default boot
