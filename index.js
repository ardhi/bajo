import App from './class/app.js'
import { shim } from 'aneka'
import fs from 'fs-extra'

shim()

/**
 * Main entry point of a Bajo app. Returned value is the app instance itself.
 *
 * While you can code directly around it, you typically write your code the main plugin (```{mainNs}```) or
 * writing your own custom plugin.
 *
 * I recommend the second method for its portability.
 *
 * Example:
 * ```javascript
 * // index.js file. Your main package entry point
 * import bajo from 'bajo'
 * await bajo()
 * ```
 *
 * @global
 * @async
 * @param {Object} [options] - App options
 * @param {string} [options.cwd] - Set current working directory. Defaults to the script directory
 * @param {string[]} [options.plugins] - Array of plugins to load. If provided, it override the list in ```package.json``` and ```.plugins``` file
 * @param {Object} [options.config] - Plugin's config object. If provided, plugin configs will no longer be read from its config files
 * @returns {App}
 */
async function boot (options = {}) {
  if (!options.cwd) options.cwd = process.cwd()
  const pkgFile = `${options.cwd}/package.json`
  const pkg = fs.readJsonSync(pkgFile)
  if (pkg.type !== 'module') {
    console.error(`Please turn on ES6 parsing by adding "type": "module" to ${pkgFile}!`)
    process.exit(1)
  }
  const app = new App(options)
  return await app.boot()
}

export default boot
