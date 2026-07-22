/**
 * # Applet
 *
 * Bajo has a built-in applet system that allows you to run your app as an applet.
 * An applet is a small command-line app that can be embedded inside a plugin, purposefully designed
 * to run a simple task mostly bound to the plugin itself. It is a convenient way to run a plugin's task
 * without having to write a separate script.
 *
 * Since it is embedded inside a plugin, it behaves like running the whole app but doing only task
 * that you want to run.
 *
 * Applet needs {@link https://ardhi.github.io/bajo-cli/|bajo-cli} plugin to be installed and loaded.
 * This is because applet is a command-line app and `bajo-cli` plugin is specifically designed to provide
 * the necessary command-line interface and function helpers to run command-line based app.
 *
 * So please make sure that `bajo-cli` is in your app's `package.json` file and in the `plugins`
 * array of your app's config before you run an applet. Otherwise, it will throw an error.
 *
 * You can run an applet by using the following command:
 * - `node index.js -a` or `node index.js --applet` to list all available applets and choose one to run
 * - `node index.js -a <pluginNs>` to list all `pluginNs` only applets and choose one to run
 * - `node index.js -a <pluginNs:appletName>` to run the specific applet directly
 *
 * On all cases, you might require to provide additional arguments and/or options to the applet.
 *
 * By default, applet won't show you any log output. This is by design because it could clutter your
 * terminal output. If you insist on seeing the log output, you have to add the `--log-applet` option.
 *
 * > **Note**: all standard bajo's command line arguments and options are also available to applet,
 * e.g. `--env=prod`, `--lang=id`, `--log-level=trace`, etc.
 *
 * > **Development** : Please visit {@link https://ardhi.github.io/bajo-cli/module-Applet.html|applet development}
 * for more details on how to create an applet.
 * @module Applet
 */

/**
 * # Hook
 *
 * Bajo has a hook system that allows you to run custom code before or after certain events in the framework.
 * You can use hooks to modify the behavior of the framework or to add new functionality.
 *
 * Your hook should be put in:
 * - your plugin's hook folder (also valid for app's `main` plugin), which is located in `{pluginRoot}/extend/bajo/hook`. In this case:
 *   - the file should be named as `{hookName}.js` for hook that listens for one name or `{hookName1}${hookName2}${hookName3}.js`
 *     for hook that listens for many names. It should be exported as default export
 *   - you can use the exact hook name or follow our convention to use kebab case for the file name, e.g. `bajo.override:after-read-config.js` for `bajo.override:afterReadConfig` hook
 *   - content should be a single {@link module:Hook.THook} object. If `name` property is there, it will be used as
 *     the hook name, otherwise it will be reconstructed from the file name. Hence the file name is important
 *   - or simply a function that will be used as the hook handler. In this case, all missing properties will be set to their default values
 * - or as array of hook object in `{pluginRoot}/extend/bajo/hook.js` file that follows the {@link module:Hook.THook} structure
 *
 * > **Note**: Hook handlers can have `.` dot symbol in their name, but in documentation, the dot symbol will be replaced with `·`
 * symbol because of JSDoc limitation. For example, a hook handler named `bajo.override:afterReadConfig` will be
 * documented as `bajo·override:afterReadConfig`.
 *
 * > **Warning**: Even though hooks is a powerfull and convenient feature, it should be used with caution. Overusing hooks can lead to code
 * that is difficult to understand and maintain. Use hooks only when necessary and avoid using them for simple tasks
 * that can be accomplished with regular code.
 * @module Hook
 */

/**
 * Hook structure definition. Your hook listener should be an object that follows this structure.
 *
 * @memberof module:Hook
 * @typedef THook
 * @type {Object}
 * @property {string|string[]} name - Hook name or array of hook names
 * @property {module:Hook.hookHandler} handler - Hook handler function
 * @property {number} [level=999] - Hook level (lower number means higher priority)
 * @property {string} src - Hook source (origin plugin name). Bajo will set this automatically, any value you set will be overriden.
 * @property {boolean} [noWait=false] - If `true`, Bajo will not wait for this hook to complete before proceeding to the next hook. Default is `false`.
 */

/**
 * This is the hook handler function that will be called when the hook is triggered.
 * This handler is scoped to the owning plugin, so you can use `this` to access the plugin instance and
 * its properties.
 * @async
 * @method
 * @callback hookHandler
 * @memberof module:Hook
 * @param {...any} args - Arguments passed to the hook handler
 * @returns {Promise<void>} The return value of the hook handler
 */

/**
 * Hook handler that runs before boot process. You can use this hook to do some pre-boot process.
 *
 * @name bajo:beforeBoot
 * @async
 * @method
 * @memberof module:Hook
 */

/**
 * Hook handler that runs after boot process. You can use this hook to do some post-boot process.
 *
 * @name bajo:afterBoot
 * @async
 * @method
 * @memberof module:Hook
 */

/**
 * Hook handler that runs after hooks are collected. You can use this hook to modify the collected hooks before
 * they are recognized as application hooks.
 *
 * @async
 * @method
 * @name bajo:afterCollectHooks
 * @memberof module:Hook
 * @param {Array<module:Hook~THook>} hooks - Array of hook objects
 * @see module:Helper.collectHooks
 */

/**
 * Hook handler that runs before all plugins are initialized. You can use this hook to do some pre-initialization process.
 *
 * @async
 * @method
 * @name bajo:beforeAllInit
 * @memberof module:Hook
 * @see module:Helper.run
 */

/**
 * Hook handler that runs after all plugins are initialized. You can use this hook to do some post-initialization process.
 *
 * @async
 * @method
 * @memberof module:Hook
 * @name bajo:afterAllInit
 * @see module:Helper.run
 */

/**
 * Hook handler that runs before all plugins are started. You can use this hook to do some pre-start process.
 *
 * @async
 * @method
 * @name bajo:beforeAllStart
 * @memberof module:Hook
 * @see module:Helper.run
 */

/**
 * Hook handler that runs after all plugins are started. You can use this hook to do some post-start process.
 *
 * @async
 * @method
 * @name bajo:afterAllStart
 * @memberof module:Hook
 * @see module:Helper.run
 */

/**
 * Hook handler that runs before `{ns}` plugins are initialized. You can use this hook to do some pre-initialization process.
 *
 * @async
 * @method
 * @memberof module:Hook
 * @name {ns}:beforeInit
 * @see module:Helper.run
 */

/**
 * Hook handler that runs after `{ns}` plugins are initialized. You can use this hook to do some post-initialization process.
 *
 * @async
 * @method
 * @memberof module:Hook
 * @name {ns}:afterInit
 * @see module:Helper.run
 */

/**
 * Hook handler that runs before `{ns}` plugins are started. You can use this hook to do some pre-start process.
 *
 * @async
 * @method
 * @memberof module:Hook
 * @name {ns}:beforeStart
 * @see module:Helper.run
 */

/**
 * Hook handler that runs after `{ns}` plugins are started. You can use this hook to do some post-start process.
 *
 * @async
 * @method
 * @memberof module:Hook
 * @name {ns}:afterStart
 * @see module:Helper.run
 */

/**
 * Hook handler that runs before applet is run. `{ns}` is the applet's namespace
 *
 * @name {ns}:beforeAppletRun
 * @async
 * @method
 * @memberof module:Hook
 * @param {...any} args - Arguments passed to the applet
 * @see module:Helper.runAsApplet
 */

/**
 * Hook handler that runs after applet is run. `{ns}` is the applet's namespace
 *
 * @name {ns}:afterAppletRun
 * @async
 * @method
 * @memberof module:Hook
 * @param {...any} args - Arguments passed to the applet
 * @see module:Helper.runAsApplet
 */

/**
 * Hook handler that runs after a non override/extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo·default:afterReadConfig
 * @memberof module:Hook
 * @param {string} file - Config file path
 * @param {string} orgObj - Original config object before parsing
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs before a configuration file override is read.
 *
 * @async
 * @method
 * @name bajo·override:beforeReadConfig
 * @memberof module:Hook
 * @param {string} fileExt - Config file extension
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs after a configuration file override is read.
 *
 * @async
 * @method
 * @name bajo·override:afterReadConfig
 * @memberof module:Hook
 * @param {string} fileExt - Config file extension
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs before a extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo.extend:beforeReadConfig
 * @memberof module:Hook
 * @param {string} fileExt - Config file extension
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs after a extended configuration file is read.
 *
 * @async
 * @method
 * @name bajo.extend:afterReadConfig
 * @memberof module:Hook
 * @param {string} fileExt - Config file extension
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs before a configuration file is read.
 *
 * @async
 * @method
 * @name bajo:beforeReadConfig
 * @memberof module:Hook
 * @param {string} file - Config file path
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs after all read processes of a configuration file are completed.
 *
 * @async
 * @method
 * @name bajo:afterReadConfig
 * @memberof module:Hook
 * @param {string} file - Config file path
 * @param {object} result - Resulting config object after parsing
 * @param {object} options - readConfig options
 */

/**
 * Hook handler that runs before a collection is built. `{ns}` is the collection's namespace. This hook is useful
 * to modify the collection items before they are built.
 *
 * @async
 * @method
 * @name {ns}:beforeBuildCollection
 * @memberof module:Hook
 * @param {string} container - Collection container name
 * @param {array<object>} items - Collection items
 * @see Bajo#buildCollections
 */

/**
 * Hook handler that runs after a collection is built. `{ns}` is the collection's namespace. This hook is useful
 * to modify the collection items after they are built.
 *
 * @async
 * @method
 * @name {ns}:afterBuildCollection
 * @memberof module:Hook
 * @param {string} container - Collection container name
 * @param {array<object>} items - Collection items
 * @see Bajo#buildCollections
 */
