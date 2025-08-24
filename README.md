# bajo

![GitHub package.json version](https://img.shields.io/github/package-json/v/ardhi/bajo) ![NPM Version](https://img.shields.io/npm/v/bajo)

> <br />**Attention**: I do NOT accept any pull request at the moment, thanks!<br /><br />

## Overview

Before we go any further, below are some terminologies I use throughout these documentations:

- ```<bajo-base-dir>```: project directory is where you write all your codes
- ```<bajo-data-dir>```: data directory, defaults to ```<bajo-base-dir>/data``` if not specifically stated
- ```<bajo-tmp-dir>```: temp directory, defaults to OS temporary directory
- ```<package>```: plugin package name as normally showed on npm listing
- ```<plugin>```: plugin name, which is camel cased version of package name

## Installation

Open your terminal and type:

```bash
$ npm install bajo
```

## Fire up!

Create a new empty directory, this will be your project directory or your ```<bajo-base-dir>```. Now goto your newly created directory, and type:

```bash
$ npm init
```

You'll be asked to name your project etc. **IMPORTANT**: don't forget to mark your project as ES6 project by setting ```type``` key in your ```package.json``` to ```module```.

After completing those steps, move on the the next one: crating bajo bootstrap.

Inside your ```<bajo-base-dir>```, create the ```index.js``` file and put these lines below:

```js
import bajo from 'bajo'
await bajo()
```

A bajo app **ALWAYS** needs a data directory to put configuration files, etc. This
could be located inside or outside your ```<bajo-base-dir>```.

Lets assume you're going to put your data directory inside your ```<bajo-base-dir>```. So please
create a new directory called ```data``` first. After that, just type in your terminal:

```bash
$ node index.js --dir-data=data
```

Or you could utilize ```dotenv``` by creating ```.env``` file in the same directory as ```index.js```, and put this inside:

```
DIR_DATA = ./data
```

Now you can omit calling node with arguments, you just need to type:

```bash
$ node index.js
```

## Configuration

### General rules

- All configuration files must be placed in ```<bajo-data-dir>/config/``` subfolder
- Config files should be named after its plugin name
- File format should be in ```.json``` or ```.js``` format
- If  ```.js``` file is used, it should be in ES6 format and should export either plain javascript object or a function (sync or async both supported)
- If it returns a function, this function will be called within its plugin scope and should return a plain js object
- Other formats (```.yml```, ```.yaml``` and ```.toml```) can also be used by installing [bajoConfig](https://github.com/ardhi/bajo-config) plugin
- Order of importance: ```.js``` > ```.json``` > ```.yml``` > ```.yaml``` > ```.toml```

### Main configuration File

It should be named ```bajo.json``` with following keys:

| Key | Type | Required | Default | Description |
| --- | ---- | -------- | ------- | ----------- |
| ```env``` | ```string``` | no | ```dev``` | App environment: ```dev``` or ```prod``` |
| ```log``` | ```object``` | no || Logger setting |
| &nbsp;&nbsp;```dateFormat``` | ```string``` | no | ```YYYY-MM-DDTHH:MM:ss.SSS[Z]```| Date format accoding to [dayjs](https://github.com/iamkun/dayjs) |
| &nbsp;&nbsp;```applet``` | ```boolean``` | no | ```false``` | Set to ```true``` if you want to show log even in [applet mode](#applet-mode) |
| &nbsp;&nbsp;```level``` | ```string``` | no || Set one of these: ```trace```, ```debug```, ```info```, ```warn```, ```error```, ```fatal``` and ```silent```. If it isn't set, it will auto selected based on environment |
| ```lang``` | ```string``` | no || Language to use. If not set, it will be auto detected |
| ```exitHandler``` | ```boolean``` | no | ```true``` | Set to ```false``` if you want your app **NOT** to exit gracefully |

### Installed Plugins

Plugins are what make Bajo Framework so great and flexible: they extends app features!

To use plugins:

1. Install with ```npm install <package>```
2. Optionally create ```<bajo-data-dir>/config/<plugin>.json``` to customize plugin settings
3. Open/create ```<bajo-data-dir>/config/.plugins``` and put ```<package>``` in it, line by line

Example below will load ```bajoConfig```, ```bajoExtra``` and ```bajoTemplate```:

```
bajo-config
bajo-extra
bajo-template
```

If you later decide to NOT load one or more plugins from your app, you just need to remove those from ```.plugins``` file or put ```#``` hash mark in front of package name and restart your app.

> **Warning**: please do not confuse between ```<package>``` and ```<plugin>```. Plugin package is the name of JS package listed on npm, while plugin name is the name of a plugin - a camel cased version of plugin package

### Configuration Overrides

You can override ANY settings on ANY configuration files with dotenv variables and program's argument switches easily.

Order of importance: dotenv variable > args switches > config files

#### dotenv

- Create/open ```<bajo-base-dir>/.env```
- Use ```__``` (double underscores) as the replacement of the dot in object
- ```DIR__DATA```: Set ```<bajo-data-dir>``` data directory
- ```DIR__TMP```: Set ```<bajo-tmp-dir>``` temp directory
- For every key in ```bajo.json```, use its snake cased, upper cased version, e.g:
  - ```env``` => ```ENV```
  - ```log.dateFormat``` => ```LOG__DATE_FORMAT```
  - ```exitHandler``` => ```EXIT_HANDLER```
- To override plugins config, prepend every key in plugin config with snake cased, upper cased version of the plugin name followed by a dot, e.g:
  - ```key``` in ```myPlugin``` => ```MY_PLUGIN.KEY```
  - ```key.subKey.subSubKey``` in ```myPlugin``` => ```MY_PLUGIN.KEY__SUB_KEY__SUB_SUB_KEY```

#### Program argument switches
- Use switches, e.g: ```node index.js --xxx=one --yyy=two```
- Every switches must be prefixed with ```--```
- Use ```-``` as the replacement of the dot in object
- ```--dir-data```: Set ```<bajo-data-dir>``` data directory
- ```--dir-tmp```: Set ```<bajo-tmp-dir>``` temp directory
- For every key in ```bajo.json```, add prefix ```--``` e.g:
  - ```env``` => ```--env=prod```
  - ```log.dateFormat``` => ```--log-dateFormat=xxx```
  - ```exitHandler``` => ```--exitHandler```
- To override plugins config, prepend every key in plugin config with the plugin name  followed by a ```:```, e.g:
  - ```key``` in ```myPlugin``` => ```--myPlugin:key```
  - ```key.subKey.subSubKey``` in ```myPlugin``` => ```--myPlugin:key-subKey-subSubKey```

## More Documentations

- [Tutorial](docs/tutorial.md)
- [User Guide](docs/user-guide.md)
- [Plugin Development](docs/plugin-dev.md)
- [API](docs/api.md)
- [Ecosystem](docs/ecosystem.md)

## License

[MIT](LICENSE)
