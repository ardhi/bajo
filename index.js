import App from './class/app.js'
import { shim } from 'aneka'
import fs from 'fs-extra'

shim()

/**
 * To be recognized as a valid Bajo app, your package must be an `ES6 module` and have a `package.json` file
 * with the additional `bajo` property and at least the `type` property set to `app`.
 *
 * You can also add the `plugins` property to specify which plugins to load. But this will be overridden
 * by the `{dataDir}/config/.plugins` file if it exists.
 *
 * Example:
 * ```json
 * {
 *   "name": "my-app",
 *   "version": "1.0.0",
 *   "description": "My Bajo app",
 *   "type": "module",
 *   "main": "index.js",
 *   "bajo": {
 *     "type": "app",
 *     "plugins": ["bajo-cli", "bajo-config"]
 *   },
 *   "dependencies": {
 *     "bajo": "^2.23.0",
 *     "bajo-cli": "^2.4.0",
 *     "bajo-config": "^2.4.0"
 *   }
 * }
 * ...
 * ```
 *
 * > **Note**: The dot symbol in `package.json` has been replaced with `·` symbol because of JSDoc theme limitation
 *
 * @global
 * @typedef package·json
 */

/**
 * Main entry point of a Bajo app. Returned value is the {@link App} instance itself.
 *
 * Inside your `index.js` file in the root folder, write something like this:
 * ```javascript
 * import { boot } from 'bajo'
 * const app = await boot()
 * // At this point, your app should be ready to use
 * // You can now use `app` to access all plugins and their features
 * ```
 *
 * Even though you can write your codes directly after boot as shown above, we strongly suggest writing
 * your code inside the {@link Main} plugin or even writing a custom {@link Plugin}.
 *
 * We recommend the second method for its portability.
 *
 * @global
 * @async
 * @param {App.TOptions} [options] App options
 * @returns {App}
 * @see {@link App}
 * @see {@link Bajo}
 */
export async function boot (options = {}) {
  if (!options.cwd) {
    const item = process.argv.find(item => item.startsWith('--cwd='))
    if (item) options.cwd = item.slice(6)
    else options.cwd = process.cwd()
  }
  const pkgFile = `${options.cwd}/package.json`
  const pkg = fs.readJsonSync(pkgFile)
  if (pkg.type !== 'module') {
    console.error('A Bajo app must be an ES6 module. Your package.json is missing the "type": "module" property')
    process.exit(1)
  }
  const app = new App(options)
  return await app.run()
}

export default boot
