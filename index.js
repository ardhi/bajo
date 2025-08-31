import App from './class/app.js'
import shim from './lib/shim.js'

shim()

/**
 * @module Boot
 */

/**
 * Main entry point of a Bajo app.
 *
 * Returned value is the app instance itself. You can code directly with it, but typically
 * you code by writing inside main plugin or writing custom plugin. I recommend the second
 * method because its portability.
 *
 * Example: custom boot loader inside your project
 * ```javascript
 * import bajo from 'bajo'
 * await bajo()
 * // That is! So simple right?!
 * ```
 * @async
 * @see {@tutorial getting-started}
 * @param {string} [cwd] - Current working directory
 * @returns {App}
 */
async function boot (cwd) {
  const app = new App(cwd)
  await app.boot()
  return app
}

export default boot
