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
   * Dispose internal references
   */
  dispose = () => {
    this.app = null
    this.plugin = null
  }
}

export default Tools
