# User Guide

## Overview

### Definitions

Before we go any further, below are some terminologies I use throughout these documentations:

- ```{project-dir}```: project directory is where you write all your codes
- ```{data-dir}```: data directory, defaults to ```{project-dir}/data``` if not specifically stated. Bajo also create this directory automatically if it doesn't exist yet
- ```{tmp-dir}```: temporary directory, defaults to OS temporary directory
- ```{pkgName}```: plugin's package name as normally showed on npm listing
- ```{ns}```: plugin name/namespace, which is the camel cased version of package name above
- ```{mainNs}```: main namespace, a special plugin & directory named ```main``` located inside your ```{project-dir}``` where you should write all your codes.

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

- You can move ```{data-dir}``` out of ```{project-dir}``` if you want, but you need to tell Bajo where to find it. More on this, please follow along
- ```{data-dir}``` should be the only place Bajo will **write** something. Bajo & its plugins should **never allow** to write anything outside ```{data-dir}``` by it self
- ```config``` is a special directory within ```{data-dir}``` where your configuration files should reside. Inside this directory, there should be:
  - a special file named ```.plugins``` that tells Bajo which plugins should be loaded
  - a file named ```bajo.json``` to configure global settings
  - and all plugin specific's config files named after its namespace
- ```main``` directory or ```{mainNs}``` main namespace is the very special plugins where you put your application codes. And yes, it is actually a normal Bajo plugin! Meaning everything in there will be handled just like a regular plugin such as ability to extend any other plugins, has it's own config file, etc; with some differences:
  - always available and can't be disabled
  - always be the last one to start
  - if this directory is missing, it will be created automatically on startup
  - if plugin's factory function is missing (```index.js```), it will be created dynamically
- ```index.js``` is the main entry to your app.

To set your ```{dir-data}``` somewhere else, you need to tell Bajo where to find it by using argument's switch.

Assume your data directory is ```my-data-dir``` in the same level as your project directory, run your app like this:

```bash
$ node index.js --dir-data=../my-data-dir
```

If using program arguments looks a bit like a hassle for you, just utilize Bajo's [dotenv](https://github.com/motdotla/dotenv) support by creating ```.env``` in your project directory and put this inside:

```text
DIR__DATA=../my-data-dir              # double underscores!!!
```

From now on you can start the app just by typing:

```bash
$ node index.js
```

### Runtime

Bajo should run perfectly fine on Nodejs version 20 or higher. Using the last stable runtime is recommended. Bajo based app is also known to run with Bun without problem.

Bajo is a pure ES6 framework and utilize dynamic imports **alot**. Running on a system with fast disk (e.g. SSD) and enough RAM is highly recommended, especially when you loads alot of plugins.

## Configuration

### General Rules

- All configuration files must be placed in ```{data-dir}/config``` subfolder
- Config files must be named after its plugin namespace
- File format should be in ```.json``` or ```.js``` format. If  ```.js``` file is used,
it should be in ES6 format and should export either plain javascript object or a function
(sync or async both supported). If it returns a function, this function will be called within its plugin scope and should return a plain js object
- Other formats (```.yml```, ```.yaml``` and ```.toml```) can also be used by installing & loading [bajoConfig](https://github.com/ardhi/bajo-config) plugin
- Order of importance: ```.js``` > ```.json``` > ```.yml``` > ```.yaml``` > ```.toml```. Meaning,
if ```.js``` exists, it will be used instead of ```.json``` or any other types

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

Plugins are what make Bajo Framework so great and flexible: they extends app features & functionalities!

To use plugins:

1. Install it with ```npm install {package}``` where ```{package}``` is the plugin's package name. You can install as many plugins as you want, for complete list of plugins plese [click here](ecosystem.md)
2. Optionally create ```{data-dir}/config/{ns}.json``` to customize plugin settings, where ```{ns}``` is the namespace or plugin name
3. Open/create ```{data-dir}/config/.plugins``` and put plugin's ```{package}``` name in it, line by line

Example below will load ```bajoConfig```, ```bajoExtra``` and ```bajoTemplate```:

```text
# .plugin file
bajo-config
bajo-extra
bajo-template
```

If you later decide to disable loading one or more plugins, you just need to remove those from ```.plugins``` file or put ```#``` hash mark in front of package name and restart your app.

> **Warning**: please do not confuse between ```{package}``` and ```{ns}```. Plugin package is the name of JS package listed on npm, while ```ns``` is the namespace or plugin name which is basically the camel-cased version of plugin's package name

### Environment Support

Configuration file support for different environment is also available. All you need todo
is just create ```{ns}-{env}.json``` in your ```{data-dir}/config```, where:

- ```{ns}```: namespace/plugin name
- ```{env}```: your desired environment (```dev``` or ```prod```)
- app wide settings with ```bajo-{env}.json``` is also possible

Bajo is smart enough to select which config file is going to be used:

1. use ```{ns}-{env}.json``` if file exists
2. if not, use ```{ns}.json```
3. if it also doesn't exists, then use ```{ns}``` config's default values

### Runtime Override

You can override ANY key-value pair settings with environment variables and program's argument switches easily. Bajo also supports [dotenv](https://github.com/motdotla/dotenv) ```.env``` file.

Order of importance: env variable > args switches > config files > default, built-in values

All values (either coming from environment variables, argument switches or config files) will be parsed using [dotenv-parse-variables](https://github.com/ladjs/dotenv-parse-variables) so please make sure you visit the repo to fully understand how it works.

#### dotenv

- Create/open ```{project-dir}/.env```
- Use ```__``` (double underscores) as replacement of dots in an object
- ```DIR__DATA```: Set ```{data-dir}``` data directory
- ```DIR__TMP```: Set ```{tmp-dir}``` temp directory
- For every key in ```{ns|bajo}.json```, use its snake-cased, upper-cased version, e.g:
  - ```env: 'prod'``` → ```ENV=prod```
  - ```log.dateFormat: 'YYYY-MM-DD'``` → ```LOG__DATE_FORMAT=YYYY-MM-DD```
  - ```exitHandler: true``` → ```EXIT_HANDLER=true```
- To override plugin config, prepend every key in plugin config with snake-cased, upper-cased version of the namespace followed by a dot, e.g:
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

- Use switches, e.g: ```node index.js --xxx=one --yyy=two```
- Use ```-``` as the replacement of dots in an object
- ```--dir-data```: Set ```{data-dir}``` data directory
- ```--dir-tmp```: Set ```{tmp-dir}``` temp directory
- For every key in ```{ns|bajo}.json```, add ```--``` prefix e.g:
  - ```env: 'prod'``` → ```--env=prod```
  - ```log.dateFormat: 'YYYY-MM-DD'``` → ```--log-dateFormat=YYYY-MM-DD```
  - ```exitHandler: true``` → ```--exitHandler```
- To override plugin's config, prepend every key in plugin config with the plugin name  followed by a colon ```:```, e.g:
  - ```key``` in ```myPlugin``` → ```--myPlugin:key=...```
  - ```key.subKey.subSubKey``` in ```myPlugin``` → ```--myPlugin:key-subKey-subSubKey=...```

Example:
```bash
$ node index.js --env=prod --log-pretty --log-timeTaken --lang=id
```
