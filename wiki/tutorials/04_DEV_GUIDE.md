# Developer Guide

This guide is intended for developers who want to create plugins for the Bajo framework. It provides an overview of the core classes, their relationships, and how to extend the framework with custom plugins.

Plugins are the building blocks of Bajo. They can be created to add new features, extend existing functionality, or integrate with external services. This guide will walk you through the process of creating a plugin, understanding the class hierarchy, and best practices for plugin development.

Finished plugins can be used in your own projects or shared with the community by publishing them to npm or other package managers. If you decide to share your plugin, please let us know so we can include it in our list of community plugins. We're more than happy to help you promote your plugin and make it available to other developers.

## Class Hierarchy

The core of Bajo is built around a few classes that form the foundation of the framework. The following diagram illustrates the class hierarchy and their relationships:

```
 +-----------+                     +-----------+      +-----------+      +-----------+
 |  Plugin   |                     |   Tools   |      |    App    |      |    Log    |
 +-----+-----+                     +-----+-----+      +-----------+      +-----------+
       |                                 |
       +----------------+                +----------------+
       |                |                |                |
 +-----+-----+    +-----+-----+    +-----+-----+    +-----+-----+
 |   Bajo    |    |   Base    |    |    Err    |    |   Print   |
 +-----------+    +-----+-----+    +-----------+    +-----------+
                        |
       +----------------+----------------+-------------------+
       |                |                |                   |
 +-----+-----+    +-----+-----+    +-----+-----+       +-----+-----+
 |   Main    |    |   Dobo    |    |  Waibu    |  ...  | MyPlugin  |
 +-----------+    +-----------+    +-----------+       +-----------+
```

All plugins in Bajo are derived from the {@link Base} class (derived in turn from the abstract class {@link Plugin}), which provides the basic structure and functionality for all plugins. The {@link Tools} class provides utility functions that can be used by plugins, while the {@link App} class represents the main application and manages the lifecycle of plugins.

Meanwhile, the {@link Log} class provides logging capabilities for debugging and monitoring.

Since every plugin is derived from the `Base` class, it inherits a reference to the main application instance through the `this.app` property, which allows plugins to access the application's inner properties and methods. And since all plugins are dynamically attached to the app instance as `this.app.pluginName` properties, they can also access other plugins' properties and methods. This allows easy communication and collaboration between plugins.

Example:
```javascript
  // In your plugin class
  ...
  async myMethod (params) {
    const { getModel } = this.app.dobo
    const model = await getModel('CdbCountry') // get `CdbCountry` model from `bajoCommonDatabase` plugin
    const query = { id: { $in: ['ID', 'MY', 'AU' ] } } // define your query here
    const limit = 10 // define your limit
    const sort = { name: 1 } // define your sort order

    const countries = await model.findRecord({ query, limit, sort }, { dataOnly: true }) // find records from the model
    console.log(countries) // log the result
  }
  ...
```

## Anatomy of a Plugin

A plugin is a normal JavaScript package with a `package.json` file and an entry point file (usually `index.js`) that exports a factory function. The factory function is called by the Bajo framework when the plugin is loaded, and it receives the package name as an argument. The factory function must return a class that extends the {@link Base} class.

### Directory Structure

Shown below is a typical directory structure of a plugin:

```
.
├── asset
│   └── logo.png
├── extend
│   ├── bajo
│   ├── intl
│   │   ├── en-US.json
│   │   └── id.json
│   ├── hook
│   │   └── ...
│   └── ...
├── lib
│   └── ...
├── package.json
└── index.js

```

While the above structure is a common convention, it is not mandatory. A plugin can have any structure as long as it has a valid `package.json` file and an entry point file that exports a factory function explained below. However, following the conventions outlined in this guide will help ensure consistency and maintainability across plugins.

### package.json

{@link Base.package·json|package.json} file must be a valid npm package with a unique name in ES6 module format. It must include a `bajo` property with at least `type` set to `plugin` to be recognized as a plugin by the Bajo framework, e.g.:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "module",
  "bajo": {
    "type": "plugin",
    "alias": "myplugin",
    "dependencies": ["dobo", "dobo-common-database"]
  },
  "main": "index.js",
  ...
}
```

Please note that the `alias` property is optional and can be used to define a custom name for the plugin when it is attached to the app instance. If not provided, the plugin will be attached using its kebab cased plugin namespace.

If the plugin has dependencies on other plugins, they must be listed in the `dependencies` array. The Bajo framework will automatically load the required plugins before loading the current plugin.

{@link Base.package·json|Click here} for details.

### Boot file

Boot file (usually `index.js`) must export a factory function with one single parameter named `pkgName` and returns a class extending the {@link Base} class, e.g.:

```javascript
// index.js
async function factory (pkgName) {
  const { Base } = this.app.baseClass
  const me = this
  return class MyPlugin extends Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {
        key: {
          subKey: 'value'
        }
      }
    }

    async init () {
      // Initialization code here
    }
  }
}

export default factory
```

### Other files and directories

While the above two files are mandatory, a plugin can also include other files and directories as needed, such as assets, or additional modules. The inner structure of the plugin is flexible and can be organized according to the developer's preferences. Bajo class offers a set of methods, conventions, and best practices for organizing plugin files, which should be followed to ensure consistency and maintainability. Some conventions you could follow are:
  - `asset/` directory: a plugin should have its own transparent png logo. If you have one, place it here with the name `logo.png`. This logo will be used in the Bajo framework's UI to represent your plugin. Other than the logo, you can also include other assets in this directory, such as images, icons, or other media files that your plugin may require.
  - `lib/` directory: this is where you can place your plugin's libraries or modules. You can organize your code into multiple files and directories within this folder, following a structure that makes sense for your plugin's functionality.
  - `extend/{otherPluginNs}` directory: if your plugin extends functionalities of other plugins, you can place the resource required for the extension here. This could include additional modules, configuration files, or other assets needed to properly extend the functionality of the other plugins. More on this in the **Extending Other Plugins** section below.
  - Use kebab case for file and directory names. This is a common convention in the JavaScript ecosystem and helps maintain consistency across your plugin's structure.

### Configuration object

A plugin should use a {@link TConfig|configuration object} to define its configurable options as much as possible. This allows users to easily customize the behavior of the plugin without modifying its code directly.

More on this see [this.config](#this.config) section below.

## Class Properties and Methods

Since all plugins are derived from the {@link Base} class, they inherit a set of properties and methods that can be used to interact with the Bajo framework and other plugins. Some of the most commonly used properties and methods include:

### _this.app_

A reference to the main {@link App|app} instance. This is may be the most used property in a plugin, as it allows you to interact with the rest of the Bajo framework and other plugins. You can use this property to access other plugins, call their methods, or retrieve their configuration:
- `this.app.{pluginNs}`: access to other plugins' properties and methods. For example, if you want to access the `dobo` plugin, you can use `this.app.dobo`.
- `this.app.lib`: access to the most commonly used libraries in Bajo, such as `_` (lodash), `fs`, `fastGlob`, `dayjs`, etc.
- `this.app.baseClass`: access to the base class definition of Bajo, such as `Base`, `Dobo`, `Waibu`, etc.
- `this.app.getAllNs()`: retrieves an array of all plugin namespaces loaded in the app
- and many more. See {@link App} for a complete list of properties and methods available in the app instance.

### _this.config_

The default configuration object, which can be overridden by environment variables, command line arguments, or configuration files. If this property is missing, Bajo will assign an empty object to it.

You are **strongly** recommended to define a default configuration object in your plugin class, as it allows users to easily customize the behavior of the plugin without modifying its code directly.

The default configuration object defined here can later be overridden by a set of methods listed below in the order of priority:
  - {@link App#envVars|Environment variables}: a plugin's configuration can be overridden by names starting with `{PLUGIN_NAMESPACE}.{KEY}` (e.g., `MY_PLUGIN.KEY__SUB_KEY`).
  - {@link App#argv|Command line arguments}: a plugin's configuration can be overridden by names starting with `--{pluginNs}:{key}` (e.g., `--myPlugin:key-subKey`).
  - Configuration files with env: a plugin's configuration can be overridden by editing `{dataDir}/config/{pluginNs}-{env}.{ext}` file, where `{env}` is the environment and `{ext}` is the file extension of your choice.
  - Default configuration file: a plugin's configuration can be overridden by editing `{dataDir}/config/{pluginNs}.{ext}` file, where `{ext}` is the file extension of your choice.
  - If none are provided, the plugin will use its default configuration object defined in the plugin class.

> **Warning**: It is important to note that only values that are defined in the default configuration object can be overridden. If a key is not present in the default configuration object, it will be ignored even if it is provided in the environment variables, command line arguments, or configuration files. If you leave it empty, users will not be able to override any configuration options for your plugin.

### _this.init()_

After a plugin is successfully instantiated and loaded, the `init()` method is called. This is where you can perform any setup or initialization tasks for your plugin, or even modify the configuration object that has been overridden by the user.

This is where you can sanitize the configuration object, validate its values, or set up any necessary resources for your plugin.

### _this.start()_

After all plugins have been loaded and initialized, the `start()` method is called. This is to guarantee that all plugins are ready before any plugin starts performing its main tasks.

This is where you can safely perform your plugin's main tasks, such as starting servers, connecting to databases, etc.

After this method is called, the plugin is considered to be fully loaded and ready to use. `this.config` will be frozen and cannot be modified.

### _this.exit()_

An asynchronous method that is called when the plugin is exited gracefully. This is where you can perform any tasks that need to be done when the plugin is exiting, such as closing database connections or stopping servers.

## Extending Other Plugins

### Internationalization (i18n)

Your plugin is i18n-ready by default and you should use it extensively by providing translation files in the `extend/bajo/intl` directory. The translation files should be named using the locale code (e.g., `en-US.json`, `id.json`, etc.) and should contain key-value pairs for the translations.

Example:
- Your english translation file in `extend/bajo/intl/en-US.json`:
  ```json
  {
    "hello%s": "Hello %s, welcome to Bajo!",
    "goodbye%s": "Goodbye %s, see you later!"
  }
  ```
- Your indonesian translation file in `extend/bajo/intl/id.json`:
  ```json
  {
    "hello%s": "Halo %s, selamat datang di Bajo!",
    "goodbye%s": "Sampai jumpa %s, sampai bertemu lagi!"
  }
  ```
- Somewhere in your plugin or module:
  ```javascript
  // Assuming the current locale is set to 'en-US'
  const greeting = this.t('hello%s', 'John') // returns "Hello John, welcome to Bajo!"
  const farewell = this.t('goodbye%s', 'John') // returns "Goodbye John, see you later!"
  ```

> **Note**: Even though Bajo supports multiple formats, only JSON format is allowed for translation files. The reason is that JSON parsing is very fast and needs lower overhead compared to other formats. This is important for performance, especially when dealing with large translation files or high-traffic applications.

### Hook consumers


## Creating Extendable Plugins

