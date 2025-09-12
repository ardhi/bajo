# Getting Started

## Installation

Create a new empty directory named ```my-project```. This will be your project directory throughout this tutorial. Now, ```cd``` into your newly created directory and type:

```bash
$ npm init
```

You'll be asked to name your project, provide its description, author info, etc. Please continue until the *package.json* file is created.

Then, open it using your favorite editor, edit it, and insert the following lines:

```javascript
...
  "type": "module",
  "bajo": {
    "type": "app"
  },
...
```

After completing these steps, install Bajo by running:

```bash
$ npm install bajo
```

Now, create your app's bootstrap file, ```index.js```, and add these lines:

```javascript
// index.js file
import bajo from 'bajo'
await bajo()
```

A Bajo-based app **ALWAYS** needs a data directory for its config files, etc. This directory can be located inside or outside your project directory. If this directory doesn't exist yet, Bajo will create a new one for you, named ```data```, in the same location as your ```index.js``` file. By default, Bajo will set this as your data directory.

Bajo will also automatically create the ```main``` directory to serve as your main plugin if it doesn't already exist. A factory file named ```index.js``` will be added inside the ```main``` directory. More on this later in the next chapter.

Now, run your app:

```bash
$ node index.js
```

Congratulations! Your Bajo-based app is up and running!

## Playing Around

By now, your directory structure should look like this:

```
|- my-project
|  |- data
|  |  |- config
|  |- main
|  |  |- index.js
|  |- node_modules
|  |  |- ...
|  |- index.js
|  |- package.json
|  |- package-lock.json
```
Your app runs in the ```dev``` environment by default. In this environment, the log level is set to ```debug```, which can be overridden using program arguments:

```bash
$ node index.js --log-level=trace --log-timeTaken --log-pretty
```

Now, Bajo will show you a bunch of pretty, colorful logs, including the time each step took. This is very useful for debugging and for finding out which activity takes the most time.

But typing program arguments is tedious and boring. Let's use a config file to do some magic. Please create the JSON file ```data/config/bajo.json``` and add these lines to it:

```json
{
  "env": "dev",
  "log": {
    "pretty": true,
    "level": "trace",
    "timeTaken": true
  }
}
```

Now, try simply running your app without any arguments:

```bash
$ node index.js
```

Much better! And hassle-free!

You can mix and match config file and program arguments on any key-value pairs anytime you want. You can even utilize environment variables and a dotenv ```.env``` file if you really need to. Please read the *User Guide* for more in-depth information on this.

## Your First Project

Let's start with **Hello World!**, the Bajo way.

The objectives of this short course are:
- reading values ​​from the configuration
- copying those values ​​into properties in the main plugin during initialization
- displaying values ​​while the program is running
- notifying if the program terminates

Let's go!

### Config Object

Please open the ```data/config/main.json``` file or create a new one if it doesn't exist. This is the main plugin configuration file.

Enter these lines:

```json
{
  "firstName": "Tanjiro",
  "lastName": "Kamado",
  "age": 15
}
```

Each Bajo plugin can be configured through the configuration file located at ```{data-dir}/config/{ns}.json```, where ```{data-dir}``` is the data directory location and ```{ns}``` is the namespace or plugin name. Please visit *Getting Started* for more info.

As you may know now, in Bajo, you create everything through plugins. If your project is small or not very complicated, you can use the main plugin that's always ready and available. But over time, as your app gets bigger and bigger, you'll need to start thinking about breaking things into small pieces through independent plugins.

### Plugin Factory

Now let's open ```main/index.js``` and update it according to the example below.

This file is the main plugin factory. It gets created automatically if it's not there.

```javascript
async function factory (pkgName) {
  const me = this

  return class Main extends this.app.pluginClass.base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }

    init = async () =>  {
      this.firstName = this.config.firstName
      this.lastName = this.config.lastName
      this.age = this.config.age
    }

    start = async () => {
      this.log.info('First name: %s, Last name: %s, age: %d', this.firstName, this.lastName, this.age)
    }

    exit = async () => {
      this.log.warn('Program aborted')
    }
  }
}

export default factory
```

A couple of things to note:

- At boot, the main plugin reads its configuration file main.json and merges it with all program arguments and environment variables it can find which belong to it and builds its config object.
- Then, plugin initialization happens. In this step, all code inside the asynchronous method ```init``` will be executed. In this example, all object config's key-value pairs will be assigned to the plugin's properties.
- Then, the plugin will start. All code inside the asynchronous method ```start``` will be invoked. In this example, it simply writes the first name, last name, and age to the logger.
- At program exit, the asynchronous method ```exit``` will be executed.

That's the lifecycle of all Bajo plugins, including the main plugin.

But unfortunately, if you run it now, you'll get an error. That's because the root keys of the config object from the configuration file (```firstName```, ```lastName```, and ```age```) aren't defined in ```this.config``` and are ignored during initialization.

That's why we need to fix it first:

```
...
    constructor () {
      super(pkgName, me.app)
      this.config = {
        firstName: 'John',
        lastName: 'Doe',
        age: 50
      }
    }
...
```

```this.config``` defined in the constructor serves as the default config object. During initialization, this will be merged with values from the configuration file. If one or more keys are missing from the configuration file, the related default values are used.

If you run this now, you'll get a bunch of logs. Let's filter it with:

```bash
$ node index.js --log-level=info
2025-09-12T00:09:38.946Z +97ms INFO: main First name: Tanjiro, Last name: Kamado, age: 15
2025-09-12T00:09:38.949Z +3ms WARN: main Program aborted
```

Sweet!

## The Hook System

### Tapping an Existing Hook

Bajo offers you a hook system in which you can tap certain actions anywhere in the system with your own code. Let's go through the simplest one: running your code just after the boot process is completed.

First, create ```main/extend/bajo/hook/bajo@after-boot-complete.js```. If you're curious about the reason for the unusual file name, please refer to the *User Guide* on Hook's naming rules.

```javascript
async function afterBootComplete () {
  this.log.info('Hook after boot complete')
}

export default afterBootComplete
```

Pretty easy, right?

### Your Own Hook

Now let's create your own hook. Even though it's silly to use a hook for such a simple program, its purpose is to demonstrate how easy it is to do it in Bajo.

This time, we want to change the property ```lastName``` with hook.

Open ```index.js``` and update it accordingly:

```javascript
...
    init = async () => {
      const { runHook } = this.app.bajo // add this line
      this.firstName = this.config.firstName
      this.lastName = this.config.lastName
      this.age = this.config.age
      await runHook('main:myHook') // and this line
    }
...
```

The above code should add a hook named ```main:myHook``` in the initialization step.

Now, create a new file ```main/extend/bajo/hook/main@my-hook.js```:

```javascript
async function myHook () {
  this.lastName = 'THE Daemon Slayer'
}

export default myHook
```

As every class method, hook, and function handler in Bajo is called within its own plugin scope, it is sufficient to set ```this.lastName``` directly inside a hook.

Now run it. It should show you something like these:

```bash
2025-09-12T12:09:09.004Z +115ms INFO: main First name: Tanjiro, Last name: THE Daemon Slayer, age: 15
2025-09-12T12:09:09.008Z +4ms INFO: main Hook after boot complete
2025-09-12T12:09:09.009Z +1ms WARN: main Program aborted
```

## Using Plugins

