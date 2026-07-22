# User Guide

## Overview

### Definitions

Before we go any further, let's define some terms that will be used throughout this guide:

1. `{appDir}` - The application directory, which is the root directory of your Bajo app. This is where all your application files reside, and it is typically the directory where you run your app from.
2. `{dataDir}` - The data directory, which is where Bajo stores its configuration files, plugin data, and other persistent information. By default, this is a subdirectory named `data` within your `{appDir}`.
3. `{tmpDir}` - The temporary directory, which is where Bajo stores temporary files and caches. By default, Bajo will simply use the system's temporary directory, but you can configure it to be a directory of your choice.
4. `{pkgName}` - The plugin's package name, that is the name in `package.json`, typically matching its npm listing.
5. `{ns}`: The plugin namespace or name for short, which is the camel-cased version of the package name.
6. `{mainNs}` - The special plugin's `main` namespace and directory named `main` within your `{appDir}`; this is where all application code should be written. It is created automatically if it doesn't exist yet.

### Directory Structure

Your typical Bajo app directory structure should look like this:

```
.
└── {appDir}
    ├── {dataDir}
    │   ├── config
    │   │   ├── .plugin
    │   │   ├── bajo.yml
    │   │   ├── main.yml
    │   │   └── ...
    │   └── plugins
    │       └── ...
    ├── main
    │   ├── extend
    │   │   └── ...
    │   ├── index.js
    │   └── ...
    ├── package.json
    ├── index.js
    └── ...
```

This to note:
1. You can move `{dataDir}` out of `{appDir}` if you want, but you need to tell Bajo where to find it. For more on this, please follow along.
2. `{dataDir}` should be the only place Bajo **writes** anything. Bajo and its plugins should **never** be allowed to write anything outside `{dataDir}` on their own.
3. `config` is a special directory within `{dataDir}` where your configuration files should reside. Inside this directory, you should find:
   - a special file named `.plugins` that tells Bajo which plugins should be loaded
   - a file named `bajo.yml` to override global settings
   - all plugin-specific config files, named after their namespace
   - you can use `.json` if you prefer, but `.yml` is recommended for better readability
4. The `main` directory, or `{mainNs}` namespace, is the {@link Main|special plugin} where you put your application code. And yes, it is actually a normal Bajo plugin! This means everything in there will be handled just like a regular plugin like it has the ability to extend other plugins, has its own config file, and more — with a few differences:
   - it's always available and can't be disabled
   - it's always the last one to start
   - if this directory is missing, it will be created automatically on startup
   - if the plugin's factory function is missing (`index.js`), it will be created dynamically
   - {@link Main|click here} for more details about the `main` plugin
5. `index.js` is the main entry point for your app.

To set your `{dataDir}` somewhere else, you need to tell Bajo where to find it by using an argument switch.

Assuming your data directory is `my-data-dir` at the same level as your app directory, run your app like this:

```bash
$ node index.js --dir-data=../my-data-dir
```

If using program arguments seems a bit like a hassle for you, just use Bajo's [dotenv](https://github.com/motdotla/dotenv) support. Create a `.env` file in your app directory and put this inside:

```text
DIR__DATA=../my-data-dir              # double underscores!!!
```

From now on, you can start the app just by typing:

```bash
$ node index.js
```

### Runtime

Bajo should run perfectly fine on Node.js version 20 or higher. Using the latest stable runtime is recommended. Bajo-based apps are also known to run with **Bun** without any problems. But Bajo **cannot** run on Deno due to its heavy reliance on Node.js-specific libraries and environments.

Bajo is a pure ES6 framework that utilizes dynamic imports `a lot`. Running on a system with a fast disk (e.g., SSD) and enough RAM is highly recommended, especially when you load a lot of plugins.

## Configuration

### General Rules

- All configuration files must be placed in the `{dataDir}/config` subfolder.
- Config files must be named after their plugin namespace.
- The file format should be either `.yml`, `.json` or `.js`. If a `.js` file is used, it must be in ES6 format and should export either a plain JavaScript object or a function. Both synchronous and asynchronous functions are supported. If it returns a function, this function will be called within its plugin scope and should return a plain JS object.
- Other formats e.g. `.toml` can also be used by installing and loading the [bajoConfig](https://ardhi.github.io/bajo-config) plugin.
- The order of precedence is `.js` > `.json` > `.yml` > `.toml`. This means that if a `.js` file exists, it will be used instead of a `.json` file or any other format.

Example: bajo.yml
```yaml
env: prod
log:
  pretty: true
  timeTaken: true
lang: id
```

### Using Plugins

Plugins are what make the Bajo Framework so great and flexible: they extend app features and functionalities!

To use plugins, follow these steps:

1. Install it with `npm install {pkgName}`, where `{pkgName}` is the plugin's package name. You can install as many plugins as you want; for a complete list of plugins, please {@tutorial 05_ECOSYSTEM}.
2. Optionally, create `{dataDir}/config/{ns}.yml` to customize the plugin's settings, where `{ns}` is the plugin namespace/name.
3. Open or create `{dataDir}/config/.plugins` and list the plugin's `{pkgName}` name in it, one per line. Use a `#` hash mark in front of the package name to disable it. The order of the plugins in this file is mostly NOT important, as Bajo will detect automatically.

For example, the text below will load `bajo-config`, `bajo-extra`, and `bajo-template` plugins:

```text
# .plugin file
bajo-config
bajo-extra
bajo-template
```

If you later decide to disable one or more plugins, you just need to remove them from the `.plugins` file or place a `#` hash mark in front of the package name and restart your app.

> **Warning**: Please do not confuse `{pkgName}` and `{ns}`. The plugin package name is the name of the JS package listed on npm, while `{ns}` is the plugin namespace or name for short, which is basically the camel-cased version of the plugin's package name.

### Environment Support

Configuration file support for different environments is also available. All you need to do is create a `{ns}-{env}.yml` file in your `{dataDir}/config`, where:

- `{ns}`: the namespace/plugin name
- `{env}`: your desired environment (`dev` or `prod`)

App-wide settings with `bajo-{env}.yml` are also possible.

Bajo is smart enough to select which config file will be used based on the following order of precedence:

1. Use `{ns}-{env}.yml` if the file exists.
2. If not, use `{ns}.yml`.
3. If that also doesn't exist, then use the plugin's default config values.

### Runtime Override

#### Environment Variables

You can easily override ANY key-value pair setting with environment variables and program argument switches. Bajo also supports [dotenv](https://github.com/motdotla/dotenv) with a `.env` file.

The order of precedence is always: environment variable > argument switches > config files > default, built-in values.

All values (whether they come from environment variables, argument switches, or config files) will be parsed using [dotenv-parse-variables](https://github.com/ladjs/dotenv-parse-variables), so please make sure you visit the repository to fully understand how it works.

- Create or open `{appDir}/.env`
- Use `__` (double underscores) as replacement for dots in an object.
- `DIR__DATA`: Sets the `{dataDir}` data directory.
- `DIR__TMP`: Sets `{tmpDir}` temporary directory.
- For every key in `{ns|bajo}.yml`, use its snake-cased, upper-cased version, e.g.:
  - `env: 'prod'` → `ENV=prod`
  - `log.dateFormat: 'YYYY-MM-DD'` → `LOG__DATE_FORMAT=YYYY-MM-DD`
  - `exitHandler: true` → `EXIT_HANDLER=true`

To override a plugin's config, prepend every key in the plugin's config with the snake-cased, upper-cased version of the namespace followed by a dot. For example:
  - `key` in `myPlugin` → `MY_PLUGIN.KEY=...`
  - `key.subKey.subSubKey` in `myPlugin` → `MY_PLUGIN.KEY__SUB_KEY__SUB_SUB_KEY=...`

Example:
```text
# .env file
ENV=prod
LOG__PRETTY=true
LOG__TIME_TAKEN=true
LANG=id
```

#### Argument Switches

You can also override ANY key-value pair setting with argument switches. This is especially useful when you want to run your app with different settings without changing the `.env` file or config files:

- Use switches, e.g.: `node index.js --xxx=one --yyy=two`
- Use `-` as the replacement for dots in an object.
- `--dir-data`: Sets the `{dataDir}` data directory.
- `--dir-tmp`: Sets the `{tmpDir}` temporary directory.
- For every key in `{ns|bajo}.yml`, add `--` prefix. E.g.:
  - `env: 'prod'` → `--env=prod`
  - `log.dateFormat: 'YYYY-MM-DD'` → `--log-dateFormat=YYYY-MM-DD`
  - `exitHandler: true` → `--exitHandler`
- To override a plugin's config, prepend every key in the plugin's config with the plugin name followed by a colon `:`. E.g.:
  - `key` in `myPlugin` → `--myPlugin:key=...`
  - `key.subKey.subSubKey` in `myPlugin` → `--myPlugin:key-subKey-subSubKey=...`

Example:
```bash
$ node index.js --env=prod --log-pretty --log-timeTaken --lang=id
```

## System Hook

A **hook** refers to a mechanism that allows you to inject a custom function to extend Bajo's functionality at specific points. These points are typically predefined by the framework, providing opportunities to execute code before, or after a particular operation.

### Usage

In Bajo, hooks can be created anywhere very easily. Simply call the `runHook` method followed by a number of parameters you want to pass or none at all. The hook name is always in the form of {@link Bajo.TNsPathPairs}, and represents the hook point any plugin can hook into.

You can then create a hook listener in your `main` plugin hook directory, which will be called when the hook is executed.

For more info, please read the {@link module:Hook|here}.

Example:

1. Somewhere in your JavaScript file, add the following code snippet:

   ```javascript
   const { runHook } = this.app.bajo
   await runHook('main:sayHello', 'Don', 'Meri', { movie: 'Jumbo', year: 2025 })
   ```
2. Go to directory `{appDir}/main/extend/bajo/hook`. Create one if it doesn't exist yet.
3. Create file `main@say-hello.js` in the directory above.
4. Enter these lines:
   ```javascript
   async function sayHello (...params) {
     const [mainChar, friend, payload] = params
     console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
   }

   export default sayHello
   ```

Note the hook name and its associated file name:

`main:sayHello` → `main@say-hello.js`

This is because a colon (`:`) is prohibited in a file name, so Bajo replaces it with the `@` symbol. And yes, the file name is case-sensitive and must match a correct hook name, so make sure you use the exact same name in both places. But
you are also allowed to use the kebab-cased version of the hook name (in fact this is the recommended way to make your file name more readable).

During the boot process, Bajo will scan for hook files and load them into the app hook list. When your `runHook` is executed, Bajo will find its related hook from the list. If such a hook exists, its function handler will be called.

### Anatomy

Many times, there are more than one handler listening for a particular hook name. Especially in a framework that uses plugins extensively like Bajo, many plugins can listen to one hook at the same time. This creates a problem with call order.

To overcome this problem, Bajo gives you the opportunity to set a `level`. Function handlers with a lower level will be called earlier. Functions with no level will be assigned level `999` by default.

Now, change your ```main@say-hello.js``` file above to export an object instead of a function:

```javascript
const sayHello = {
  level: 10, // <-- will get called earlier than any other handler with a higher level
  handler: async function (...params) {
    const [mainChar, friend, payload] = params
    console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
  }
}
```

### Caveats

Hooks give you a lot of flexibility and freedom, but you need to be aware of the following caveats:

1. You need to use an **asynchronous** function. Even if your function is synchronous, it will be called as an asynchronous one—and as you know, there is a performance degradation when using asynchronous operations
2. **Stay away** from using `runHook` inside a hook! Even though it's possible, your code will become unreadable and messy pretty soon.
3. It's hard to trace errors in a hook. Because of its sequential nature, if a handler that's called earlier than yours throws an error, your hook won't be called at all.
4. If you use so many plugins that use the hook system so extensively with so many files, your app's boot time can take much longer than it's supposed to.

Our advice is to **use it wisely**. Don't use hooks unless necessary; this will make your app or plugin clean and easy to understand.

