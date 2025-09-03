import path from 'path'
import resolvePath from './resolve-path.js'
import { fileURLToPath } from 'url'

/**
 * Get current directory & file. An attempt to brings back the old ```__dirname``` and ```__filename```
 * to the ES6 era.
 *
 * Returns object with the following keys:
 * - ```__dirname``` (aliases to ```dir```) - current directory name
 * - ```__filename``` (aliases to ```file```) - current file path
 *
 * Example:
 * ```javascript
 * const { importModule } = this.app.bajo
 * const currentLoc = await importModule('bajo:/lib/current-loc.js')
 *
 * const { __dirname, __filename } = currentLoc(import.meta)
 * console.log(__dirname, __filename)
 * ```
 *
 * @method
 * @memberof module:Lib
 * @param {Object} metaImport - ```import.meta``` object
 * @returns {Object}
 */
const currentLoc = (metaImport) => {
  const file = resolvePath(fileURLToPath(metaImport.url))
  const dir = path.dirname(file)
  return { dir, file, __dirname: dir, __filename: file }
}

export default currentLoc
