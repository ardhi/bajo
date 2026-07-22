/**
 * Tools class. Basic utility class that provides common functionalities for other classes to extend.
 * It serves as a base class for error handling, printing, and other utility operations.
 *
 * @class
 */
class Tools {
  constructor (plugin) {
    /**
     * Reference to the plugin instance that this Tools class is associated with
     * @type {Plugin}
     */
    this.plugin = plugin

    /**
     * Reference to the app instance
     * @type {App}
     */
    this.app = plugin.app
  }

  /**
   * Force bind methods to `this` context.
   *
   * @method
   * @param {string[]} names - Method's names
   * @returns {void}
   */
  selfBind (names = []) {
    for (const name of names) {
      this[name] = this[name].bind(this)
    }
  }

  /**
   * Dispose internal references.
   *
   * @async
   * @method
   * @returns {Promise<void>}
   */
  dispose = async () => {
    this.app = null
    this.plugin = null
  }
}

export default Tools
