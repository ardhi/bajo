# User Guide

## Overview

### Definitions

Before we go any further, here are some of the terminologies I use throughout this documentation:

- ```{project-dir}```: The project directory is where you write all your code.
- ```{data-dir}```: The data directory defaults to ```{project-dir}/data``` if not specifically stated. Bajo also creates this directory automatically if it doesn't already exist.
- ```{tmp-dir}```: The temporary directory defaults to the OS temporary directory.
- ```{pkgName}```: The plugin's package name, as it normally appears on an npm listing.
- ```{ns}```: The plugin name or namespace, which is the camel-cased version of the package name.
- ```{mainNs}```: The main namespace, a special plugin and directory named ```main``` located inside your ```{project-dir}``` where you should write all your code.

### Directory Structure

Your typical Bajo app directory structure should look like this:

```
|- {project-dir}
|  |- {data-dir}
|  |  |- config
|  |  |  |- .plugin
|  |  |  |- bajo.json
|  |  |  |- main.json
|  |  |  |- ...
|  |- main
|  |  |- extend
|  |  |- index.js
|  |  |  ...
|  |- package.json
|  |- index.js
|  |  ...
```

- You can move ```{data-dir}``` out of ```{project-dir}``` if you want, but you need to tell Bajo where to find it. For more on this, please follow along.
- ```{data-dir}``` should be the only place Bajo **writes** anything. Bajo and its plugins should **never** be allowed to write anything outside ```{data-dir}``` on their own.
- ```config``` is a special directory within ```{data-dir}``` where your configuration files should reside. Inside this directory, you should find:
  - a special file named ```.plugins``` that tells Bajo which plugins should be loaded
  - a file named ```bajo.json``` to configure global settings
  - all plugin-specific config files, named after their namespace
- The ```main``` directory, or ```{mainNs}``` namespace, is the special plugin where you put your application code. And yes, it is actually a normal Bajo plugin! This means everything in there will be handled just like a regular plugin—it has the ability to extend other plugins, has its own config file, and more — with a few differences:
  - it's always available and can't be disabled
  - it's always the last one to start
  - if this directory is missing, it will be created automatically on startup
  - if the plugin's factory function is missing (```index.js```), it will be created dynamically
- ```index.js``` is the main entry point for your app.

To set your ```{data-dir}``` somewhere else, you need to tell Bajo where to find it by using an argument switch.

Assuming your data directory is ```my-data-dir``` at the same level as your project directory, run your app like this:

```bash
$ node index.js --dir-data=../my-data-dir
```

If using program arguments seems a bit like a hassle for you, just use Bajo's [dotenv](https://github.com/motdotla/dotenv) support. Create a ```.env``` file in your project directory and put this inside:

```text
DIR__DATA=../my-data-dir              # double underscores!!!
```

From now on, you can start the app just by typing:

```bash
$ node index.js
```

### Runtime

Bajo should run perfectly fine on Node.js version 20 or higher. Using the latest stable runtime is recommended. Bajo-based apps are also known to run with Bun without any problems.

Bajo is a pure ES6 framework that utilizes dynamic imports ```a lot```. Running on a system with a fast disk (e.g., SSD) and enough RAM is highly recommended, especially when you load a lot of plugins.

## Configuration

### General Rules

- All configuration files must be placed in the ```{data-dir}/config``` subfolder.
- Config files must be named after their plugin namespace.
- The file format should be either ```.json``` or ```.js```. If a ```.js``` file is used, it must be in ES6 format and should export either a plain JavaScript object or a function. Both synchronous and asynchronous functions are supported. If it returns a function, this function will be called within its plugin scope and should return a plain JS object.
- Other formats (```.yml```, ```.yaml```, and ```.toml```) can also be used by installing and loading the [bajoConfig](https://github.com/ardhi/bajo-config) plugin.
- Other formats (```.yml```, ```.yaml``` and ```.toml```) can also be used by installing & loading [bajoConfig](https://github.com/ardhi/bajo-config) plugin
- The order of precedence is ```.js``` > ```.json``` > ```.yml``` > ```.yaml``` > ```.toml```. This means that if a .js file exists, it will be used instead of a .json file or any other format.

Example: bajo.json
```json
{
  "env": "prod",
  "log": {
    "pretty": true,
    "timeTaken": true
  },
  "lang": "id"
}
```

### Using Plugins

Plugins are what make the Bajo Framework so great and flexible: they extend app features and functionalities!

To use plugins, follow these steps:

1. Install it with ```npm install {package}```, where ```{package}``` is the plugin's package name. You can install as many plugins as you want; for a complete list of plugins, please [click here](ecosystem.md).
2. Optionally, create ```{data-dir}/config/{ns}.json``` to customize the plugin's settings, where ```{ns}``` is the namespace or plugin name.
3. Open or create ```{data-dir}/config/.plugins``` and list the plugin's ```{package}``` name in it, one per line.

For example, the text below will load ```bajo-config```, ```bajo-extra```, and ```bajo-template```:

```text
# .plugin file
bajo-config
bajo-extra
bajo-template
```

If you later decide to disable one or more plugins, you just need to remove them from the ```.plugins``` file or place a ```#``` hash mark in front of the package name and restart your app.

> **Warning**: Please do not confuse ```{package}``` and ```{ns}```. The plugin package is the name of the JS package listed on npm, while ```{ns}``` is the namespace or plugin name, which is basically the camel-cased version of the plugin's package name.

### Environment Support

Configuration file support for different environments is also available. All you need to do is create a ```{ns}-{env}.json``` file in your ```{data-dir}/config```, where:

- ```{ns}```: the namespace/plugin name
- ```{env}```: your desired environment (```dev``` or ```prod```)
- App-wide settings with ```bajo-{env}.json``` are also possible.

Bajo is smart enough to select which config file will be used based on the following order of precedence:

1. Use ```{ns}-{env}.json``` if the file exists.
2. If not, use ```{ns}.json```.
3. If that also doesn't exist, then use the plugin's default config values.

### Runtime Override

You can easily override ANY key-value pair setting with environment variables and program argument switches. Bajo also supports [dotenv](https://github.com/motdotla/dotenv) with a ```.env``` file.

The order of precedence is: environment variable > argument switches > config files > default, built-in values.

All values (whether they come from environment variables, argument switches, or config files) will be parsed using [dotenv-parse-variables](https://github.com/ladjs/dotenv-parse-variables), so please make sure you visit the repository to fully understand how it works.

#### dotenv

- Create or open ```{project-dir}/.env```
- Use ```__``` (double underscores) as replacement for dots in an object.
- ```DIR__DATA```: Sets the ```{data-dir}``` data directory.
- ```DIR__TMP```: Sets ```{tmp-dir}``` temporary directory.
- For every key in ```{ns|bajo}.json```, use its snake-cased, upper-cased version. For example:
  - ```env: 'prod'``` → ```ENV=prod```
  - ```log.dateFormat: 'YYYY-MM-DD'``` → ```LOG__DATE_FORMAT=YYYY-MM-DD```
  - ```exitHandler: true``` → ```EXIT_HANDLER=true```
- To override a plugin's config, prepend every key in the plugin's config with the snake-cased, upper-cased version of the namespace followed by a dot. For example:
  - ```key``` in ```myPlugin``` → ```MY_PLUGIN.KEY=...```
  - ```key.subKey.subSubKey``` in ```myPlugin``` → ```MY_PLUGIN.KEY__SUB_KEY__SUB_SUB_KEY=...```

Example:
```text
# .env file
ENV=prod
LOG__PRETTY=true
LOG__TIME_TAKEN=true
LANG=id
```

#### Argument Switches

- Use switches, for example: ```node index.js --xxx=one --yyy=two```
- Use ```-``` as the replacement for dots in an object.
- ```--dir-data```: Sets the ```{data-dir}``` data directory.
- ```--dir-tmp```: Sets the ```{tmp-dir}``` temporary directory.
- For every key in ```{ns|bajo}.json```, add ```--``` prefix. For example:
  - ```env: 'prod'``` → ```--env=prod```
  - ```log.dateFormat: 'YYYY-MM-DD'``` → ```--log-dateFormat=YYYY-MM-DD```
  - ```exitHandler: true``` → ```--exitHandler```
- To override a plugin's config, prepend every key in the plugin's config with the plugin name followed by a colon ```:```. For example:
  - ```key``` in ```myPlugin``` → ```--myPlugin:key=...```
  - ```key.subKey.subSubKey``` in ```myPlugin``` → ```--myPlugin:key-subKey-subSubKey=...```

Example:
```bash
$ node index.js --env=prod --log-pretty --log-timeTaken --lang=id
```

## System Hook

A **hook** refers to a mechanism that allows you to inject a custom function to extend Bajo's functionality at specific points. These points are typically predefined by the framework, providing opportunities to execute code before, during, or after a particular operation.

### Usage

In Bajo, hooks can be created anywhere very easily. Simply call the ```runHook``` method followed by the parameters you want to pass.

The hook name is always in the form of [TNsPairs](global.html#TNsPathPairs), while its parameters are a rest parameter. This means you can pass any number of parameters to the function, or none at all.

Example:

- In your JavaScript file, add the following code snippet:

  ```javascript
  const { runHook } = this.app.bajo
  await runHook('main:sayHello', 'Don', 'Meri', { movie: 'Jumbo', year: 2025 })
  ````
- Go to directory ```{project-dir}/main/extend/bajo/hook```. Create one if it doesn't exist yet.
- Create file ```main@say-hello.js``` in the directory above.
- Enter these lines:
  ```javascript
  async function sayHello (...params) {
    const [mainChar, friend, payload] = params
    console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
  }

  export default sayHello
  ```

Note the hook name and its associated file name:

```main:sayHello``` → ```main@say-hello.js```

Because a colon (```:```) is prohibited in a file name, Bajo replaces it with the ```@``` symbol.

During the boot process, Bajo will scan for hook files and load them into the hook list. When your ```runHook``` is executed, Bajo will find its related object from the list. If such a hook exists, its function handler will be called.

### Anatomy

Many times, there are more than one handler listening for a particular hook name. Especially in a framework that uses plugins extensively like Bajo, many plugins can listen to one hook at the same time. This creates a problem with call order.

To overcome this problem, Bajo gives you the opportunity to set a ```level```. Functions with a lower level will be called earlier. Functions with no level will be assigned level 999 by default.

Now, change your ```main@say-hello.js``` file above to export an object instead of a function:

```javascript
const sayHello = {
  level: 10, // <-- will get called early
  handler: async function (...params) {
    const [mainChar, friend, payload] = params
    console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
  }
}
```

### Caveats

Hooks give you a lot of flexibility and freedom, but you need to be aware of the following caveats:

- You need to use an **asynchronous** function. Even if your function is synchronous, it will be called as an asynchronous one—and as you know, there is a performance degradation when using asynchronous operations
- **Stay away** from using ```runHook``` inside a hook! Even though it's possible, your code will become unreadable and messy pretty soon.
- It's hard to trace errors in a hook. Because of its sequential nature, if a handler that's called earlier than yours throws an error, your hook won't be called at all.
- If you use so many plugins that use the hook system so extensively with so many files, your app's boot time can take much longer than it's supposed to.

My advice is to **use it wisely**. Don't use hooks unless necessary; this will make your app or plugin clean and easy to understand.

