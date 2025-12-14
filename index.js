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
 * @see {@tutorial 01-getting-started}
 * @param {string} [cwd] - Current working directory
 * @returns {App}
 */
async function boot (cwd) {
  if (!cwd) cwd = process.cwd()
  const pkgFile = `${cwd}/package.json`
  const pkg = fs.readJsonSync(pkgFile)
  if (pkg.type !== 'module') {
    console.error(`Please turn on ES6 parsing by adding "type": "module" to ${pkgFile}!`)
    process.exit(1)
  }
  const app = new App(cwd)
  return await app.boot()
}

export default boot
