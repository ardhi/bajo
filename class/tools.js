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
   * Since JavaScript's `this` is dynamic, this method is useful to ensure
   * that the methods always refer to the correct instance of the class.
   *
   * Typically, you would call this method in the constructor of your plugin class,
   * passing an array of method names or imported functions that you want to bind.
   * @method
   * @param {...(string|function)} names - Method's names or function references to bind to `this` context
   * @returns {void}
   */
  bindThis (...names) {
    for (const name of names) {
      if (typeof name === 'string') this[name] = this[name].bind(this)
      else if (typeof name === 'function') {
        const methodName = name.name
        this[methodName] = name.bind(this)
      }
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
