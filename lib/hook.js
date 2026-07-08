/**
 * @module Hook
 */

/**
 * @typedef THook
 * @type {Object}
 * @property {string} name - Hook name
 * @property {string} ns - Hook namespace
 * @property {function} handler - Hook handler function
 * @property {number} [level=999] - Hook level (lower number means higher priority)
 * @property {string} src - Hook source (origin plugin namespace). Bajo will set this automatically, any value you set will be overriden.
 * @property {boolean} [noWait=false] - If true, Bajo will not wait for this hook to complete before proceeding to the next hook. Default is false.
 */

/**
 * Run before boot process. You can use this hook to do some pre-boot process.
 *
 * @name bajo:beforeBoot
 * @async
 * @method
 */

/**
 * Run after boot process. You can use this hook to do some post-boot process.
 *
 * @name bajo:afterBoot
 * @async
 * @method
 */

/**
 * Run after hooks are collected. You can use this hook to modify the collected hooks before
 * they are recognized as application hooks.
 *
 * @async
 * @method
 * @name bajo:afterCollectHooks
 * @param {Array<module:Hook~THook>} hooks - Array of hook objects
 * @see module:Helper.collectHooks
 */

/**
 * Run before all plugins are initialized. You can use this hook to do some pre-initialization process.
 *
 * @async
 * @method
 * @name bajo:beforeAllInit
 * @see module:Helper.run
 */

/**
 * Run after all plugins are initialized. You can use this hook to do some post-initialization process.
 *
 * @async
 * @method
 * @name bajo:afterAllInit
 * @see module:Helper.run
 */

/**
 * Run before all plugins are started. You can use this hook to do some pre-start process.
 *
 * @async
 * @method
 * @name bajo:beforeAllStart
 * @see module:Helper.run
 */

/**
 * Run after all plugins are started. You can use this hook to do some post-start process.
 *
 * @async
 * @method
 * @name bajo:afterAllStart
 * @see module:Helper.run
 */

/**
 * Run before `{ns}` plugins are initialized. You can use this hook to do some pre-initialization process.
 *
 * @async
 * @method
 * @name {ns}:beforeInit
 * @see module:Helper.run
 */

/**
 * Run after `{ns}` plugins are initialized. You can use this hook to do some post-initialization process.
 *
 * @async
 * @method
 * @name {ns}:afterInit
 * @see module:Helper.run
 */

/**
 * Run after `{ns}` plugins are initialized. You can use this hook to do some pre-start process.
 *
 * @async
 * @method
 * @name {ns}:beforeStart
 * @see module:Helper.run
 */

/**
 * Run after `{ns}` plugins are started. You can use this hook to do some post-start process.
 *
 * @async
 * @method
 * @name {ns}:afterStart
 * @see module:Helper.run
 */

/**
 * Run before applet is run. `{ns}` is the applet's namespace
 *
 * @name {ns}:beforeAppletRun
 * @async
 * @method
 * @param {...any} args - Arguments passed to the applet
 * @see module:Helper.runAsApplet
 */

/**
 * Run after applet is run. `{ns}` is the applet's namespace
 *
 * @name {ns}:afterAppletRun
 * @async
 * @method
 * @param {...any} args - Arguments passed to the applet
 * @see module:Helper.runAsApplet
 */

/**
 * Run before collection is built.
 *
 * @async
 * @method
 * @name bajo:beforeBuildCollection
 * @param {string} container - Collection container name
 * @see Bajo#buildCollections
 */

/**
 * Run after collection is built.
 *
 * @async
 * @method
 * @name bajo:afterBuildCollection
 * @param {string} container - Collection container name
 * @param {array<object>} items - Collection items
 * @see Bajo#buildCollections
 */

/**
 * Run after a non override/extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo.default:afterReadConfig
 * @param {string} file - Config file path
 * @param {string} orgObj - Original config object before parsing
 * @param {object} options - readConfig options
 */

/**
 * Run before a configuration file override is read.
 *
 * @async
 * @method
 * @name bajo.override:beforeReadConfig
 * @param {string} fileExt - Config file extension
 * @param {object} options - readConfig options
 */

/**
 * Run after a configuration file override is read.
 *
 * @async
 * @method
 * @name bajo.override:afterReadConfig
 * @param {string} fileExt - Config file extension
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */

/**
 * Run before a extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo.extend:beforeReadConfig
 * @param {string} fileExt - Config file extension
 * @param {object} options - readConfig options
 */

/**
 * Run after a extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo.extend:afterReadConfig
 * @param {string} fileExt - Config file extension
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */

/**
 * Run before a configuration file is read.
 *
 * @async
 * @method
 * @name bajo:beforeReadConfig
 * @param {string} file - Config file path
 * @param {object} options - readConfig options
 */

/**
 * Run after all read processes of a configuration file are completed.
 *
 * @async
 * @method
 * @name bajo:afterReadConfig
 * @param {string} file - Config file path
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */
