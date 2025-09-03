# Getting Started

## Overview

Before we go any further, below are some terminologies I use throughout these documentations:

- ```{project-dir}```: project directory is where you write all your codes
- ```{data-dir}```: data directory, defaults to ```{project-dir}/data``` if not specifically stated. But **you have to create it** manually first if it doesn't exist yet
- ```{tmp-dir}```: temporary directory, defaults to OS temporary directory
- ```{pkgName}```: plugin's package name as normally showed on npm listing
- ```{ns}```: plugin name/namespace, which is the camel cased version of package name above

## Installation

Open your terminal and type:

```bash
$ npm install bajo
```

## Fire up!

Create a new empty directory, this will be your project directory or your ```{project-dir}```. Now goto your newly created directory, and type:

```bash
$ npm init
```

You'll be asked to name your project, description, author infos etc.

After package.json is created, open it using your favorite editor, edit and insert the
following entries:

```javascript
...
  {
    "type": "module"
  },
  {
    "bajo": {
      "type": "app"
    }
  },
...
```

After completing those steps, install Bajo first by hitting:

```bash
$ npm install bajo
```

Now create application bootstrap ```index.js``` file and put these lines below:

```javascript
// index.js file
import bajo from 'bajo'
await bajo()
```

A Bajo application **ALWAYS** needs a data directory (```{data-dir}```) to put config files, etc. This could be located inside or outside your ```{project-dir}```.

Lets assume you're going to put your data directory inside your ```{project-dir}```. So please
create a new directory called ```data``` first.

After that, just type in your terminal:

```bash
$ node index.js --dir-data=data
```

Or you could utilize [dotenv](https://github.com/motdotla/dotenv) by creating ```.env``` file in the same directory as ```index.js```, and put this inside:

```text
DIR__DATA = ./data
```

From now on you can omit calling node with arguments, you just need to type:

```bash
$ node index.js
```

## Configuration

### General rules

- All configuration files must be placed in ```{data-dir}/config``` subfolder
- Config files must be named after its plugin namespace
- File format should be in ```.json``` or ```.js``` format. If  ```.js``` file is used,
it should be in ES6 format and should export either plain javascript object or a function
(sync or async both supported). If it returns a function, this function will be called within its plugin scope and should return a plain js object
- Other formats (```.yml```, ```.yaml``` and ```.toml```) can also be used by installing & loading [bajoConfig](https://github.com/ardhi/bajo-config) plugin
- Order of importance: ```.js``` > ```.json``` > ```.yml``` > ```.yaml``` > ```.toml```. Meaning,
if ```.js``` exists, it will be used instead of ```.json``` or any other types

### Installed Plugins

Plugins are what make Bajo Framework so great and flexible: they extends app features & functionalities!

To use plugins:

1. Install with ```npm install {package}``` where ```{package}``` is plugin's package name. You can install as many plugins as you want
2. Optionally create ```{data-dir}/config/{ns}.json``` to customize plugin settings, where ```{ns}``` is namespace or plugin's name
3. Open/create ```{data-dir}/config/.plugins``` and put plugin's ```{package}``` in it, line by line

Example below will load ```bajoConfig```, ```bajoExtra``` and ```bajoTemplate```:

```text
#.plugin file
bajo-config
bajo-extra
bajo-template
```

If you later decide to NOT load one or more plugins, you just need to remove those from ```.plugins``` file or put ```#``` hash mark in front of package name and restart your app.

> **Warning**: please do not confuse between ```{package}``` and ```{ns}```. Plugin package is the name of JS package listed on npm, while ```ns``` is namespace or plugin name which is it's camel-cased version of package name

### Config Overrides

You can override ANY settings on ANY config files with dotenv variables and program's argument switches easily.

Order of importance: dotenv variable > args switches > config files

#### dotenv

- Create/open ```{project-dir}/.env```
- Use ```__``` (double underscores) as the replacement of the dot in object
- ```DIR__DATA```: Set ```{data-dir}``` data directory
- ```DIR__TMP```: Set ```{tmp-dir}``` temp directory
- For every key in ```bajo.json```, use its snake cased, upper cased version, e.g:
  - ```env``` → ```ENV```
  - ```log.dateFormat``` → ```LOG__DATE_FORMAT```
  - ```exitHandler``` → ```EXIT_HANDLER```
- To override plugins config, prepend every key in plugin config with snake cased, upper cased version of the plugin name followed by a dot, e.g:
  - ```key``` in ```myPlugin``` → ```MY_PLUGIN.KEY```
  - ```key.subKey.subSubKey``` in ```myPlugin``` → ```MY_PLUGIN.KEY__SUB_KEY__SUB_SUB_KEY```

#### Program argument switches
- Use switches, e.g: ```node index.js --xxx=one --yyy=two```
- Every switches must be prefixed with ```--```
- Use ```-``` as the replacement of the dot in object
- ```--dir-data```: Set ```{data-dir}``` data directory
- ```--dir-tmp```: Set ```{tmp-dir}``` temp directory
- For every key in ```bajo.json```, add prefix ```--``` e.g:
  - ```env``` → ```--env=prod```
  - ```log.dateFormat``` → ```--log-dateFormat=xxx```
  - ```exitHandler``` → ```--exitHandler```
- To override plugin's config, prepend every key in plugin config with the plugin name  followed by a colon ```:```, e.g:
  - ```key``` in ```myPlugin``` → ```--myPlugin:key```
  - ```key.subKey.subSubKey``` in ```myPlugin``` → ```--myPlugin:key-subKey-subSubKey```
