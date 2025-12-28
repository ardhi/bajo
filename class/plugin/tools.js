/**
 * Base tools class
 *
 * @class
 */

class Tools {
  constructor (plugin) {
    /**
     * Attached plugin
     * @type {Plugin}
     */
    this.plugin = plugin

    /**
     * The app instance
     * @type {App}
     */
    this.app = plugin.app
  }

  /**
   * Force bind methods to self (```this```)
   *
   * @param {string[]} names - Method's names
   */
  selfBind (names) {
    for (const name of names) {
      this[name] = this[name].bind(this)
    }
  }

  /**
   * Dispose internal references
   */
  dispose () {
    this.app = null
    this.plugin = null
  }
}

export default Tools
