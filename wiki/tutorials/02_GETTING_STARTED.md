# Getting Started

Welcome! In this guide, we will take our first steps with Bajo together.

If this is your first time working with this framework, that is completely fine. We will move step by step: installation, project structure, basic configuration, and your first small app. Along the way, you will also meet two important ideas in Bajo: plugins and hook/lifecycle.

By the end of this tutorial, you should feel comfortable enough to continue to Bajo's sub-frameworks, such as Dobo and Waibu.

## Installation

First, create a new empty directory named ```my-project```. We will use this as the app directory throughout the tutorial. Then, move into that directory with ```cd``` and run:

```bash
$ npm init
```

You will be asked for information such as project name, description, and author. Continue until the *package.json* file is created.

Next, open that file in your editor and add the following lines:

```javascript
...
  "type": "module",
  "bajo": {
    "type": "app"
  },
...
```

After that, install Bajo:

```bash
$ npm install bajo
```

Now create a bootstrap file named `index.js` and add:

```javascript
// index.js file
import { boot } from 'bajo'
await boot()
```

A Bajo app **always** needs a data directory for configuration files and related resources. This directory can be inside or outside your app directory.

If the directory does not exist yet, Bajo will ask you whether to create one automatically or to abort. If you decide to create it, Bajo will make a directory named `data`, next to your `index.js` file. By default, this becomes your data directory.

Now run your app:

```bash
$ node index.js
```

Great work. Your first Bajo app is now running.

## Playing Around

At this point, your project structure should look like this:

```
.
└── my-project
    ├── data
    │   └── config
    ├── main
    │   └── index.js
    ├── node_modules
    │   └── ...
    ├── index.js
    ├── package.json
    └── package-lock.json
```

Bajo automatically creates a `main` plugin for you. This is the main plugin of your app, and it is where you will put your code.

By default, the app runs in the `dev` environment. In this mode, the log level is set to `debug`. You can override it using program arguments to something like `trace`, which is the most verbose level, and some other options:

```bash
$ node index.js --log-level=trace --log-timeTaken --log-pretty
```

You should now see more colorful logs, including timing information for each step. This is very useful for debugging and for finding slow parts of the startup process.

Typing arguments every time can feel repetitive, so let's move those settings into a config file. Create `data/config/bajo.yml` and add:

```yaml
env: dev
log:
  pretty: true
  level: trace
  timeTaken: true
```

> If you like JSON, you can also use `bajo.json` instead of `bajo.yml`. Bajo supports both formats.

Now try running the app again without extra arguments:

```bash
$ node index.js
```

Much easier.

You can combine config values, program arguments, environment variables, and even use a dotenv file (`.env`) whenever needed. For a deeper explanation, please see the *User Guide*.

## Your First Project

Now let's build a simple **Hello World** example, Bajo style.

Our goals are:
1. Read values from configuration.
2. Copy those values into plugin properties during initialization.
3. Display the values while the app is running.
4. Print a message when the app exits.

Let's begin.

### Config Object

Open `data/config/main.yml` (or create it if it does not exist). This is the configuration file for the main plugin.

Add:

```yaml
firstName: Tanjiro
lastName: Kamado
age: 15
```

Each Bajo plugin can read its configuration from `{dataDir}/config/{ns}.yml`, where `{dataDir}` is your data directory and `{ns}` is the plugin namespace or name. You can read more in the {@tutorial 03_USER_GUIDE}.

In Bajo, most features are built through plugins. For small projects, using the built-in `main` plugin is usually enough. As your project grows, you can split responsibilities into smaller independent plugins.

If you want to build your own plugin, please continue with the {@tutorial 04_DEV_GUIDE}.

### Plugin Factory

Now open `main/index.js` and update it like this:

This file is your main plugin factory. Bajo creates it automatically when needed.

```javascript
async function factory (pkgName) {
  const me = this

  return class Main extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }

    // start adding these lines
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
    // end of added lines
  }
}

export default factory
```

Here is what happens during the lifecycle:

- During boot, the main plugin reads `main.yml` and merges it with matching program arguments and environment variables to build the plugin's configuration object.
- Next, initialization runs through main plugin `init` method. In this example, we copy values from `this.config` into plugin properties.
- Then the plugin starts through the `start` method, where we print the values to the logger.
- Finally, when the app exits, the `exit` method runs.

This is the standard lifecycle pattern for all Bajo plugins, including the special main plugin.

But if you run it now, you will likely get an error. The reason is that keys from the config file (`firstName`, `lastName`, and `age`) are not yet declared in `this.config`, so they are ignored during initialization.

Let's fix that by defining default values first:

```javascript
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

The `this.config` object in the constructor acts as the default configuration. During startup, Bajo merges it with values from configuration files or program options. If any key is missing in the file, the default value is used.

Run the app again, and this time let's keep output concise with:

```bash
$ node index.js --log-level=info
2025-09-12T00:09:38.946Z +97ms INFO: main First name: Tanjiro, Last name: Kamado, age: 15
2025-09-12T00:09:38.949Z +3ms WARN: main Program aborted
```

Nice!

## The Hook System

### Tapping a Hook

Bajo has a very powerful, yet so simple hook system so you can add custom behavior at specific moments. We will start with a simple case: running code right after boot completes.

Create `main/extend/bajo/hook/bajo@after-boot.js`. If the naming looks unusual, that is expected; please read {@link module:Hook} file naming instructions for more.

```javascript
async function afterBootComplete () {
  this.log.info('Hook after boot complete')
}

export default afterBootComplete
```

That is your first hook listener. It taps into the `bajo:afterBoot` hook, which runs after the boot process completes. You can check the full list of hooks {@link module:Hook|here}.

### Your Own Hook

Now let's write your own custom hook. For this small example it may feel too over the top, but it shows how flexible Bajo can be.

This time, we will update all properties through a hook.

Open `index.js` and update it like this:

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

This will add a hook named `main:myHook` during app boot.

Now create a new file as the hook listener for the hook you just created: `main/extend/bajo/hook/main@my-hook.js`

```javascript
async function myHook () {
  // 'this' is bound to the owner plugin, that is the main plugin in this case
  this.lastName = 'THE Daemon Slayer'
}

export default myHook
```

In Bajo, class methods, hooks, and handlers run within its plugin scope, so setting `this.lastName` directly inside the hook is enough.

Run the app again. You should see output similar to this:

```bash
2025-09-12T12:09:09.004Z +115ms INFO: main First name: Tanjiro, Last name: THE Daemon Slayer, age: 15
2025-09-12T12:09:09.008Z +4ms INFO: main Hook after boot complete
2025-09-12T12:09:09.009Z +1ms WARN: main Program aborted
```

As you can see, `this.lastName` was updated by the hook successfully. You can also see the `afterBoot` hook running after the main plugin starts.

## Using External Plugins

Bajo is designed as an ecosystem of small plugins. You can think of them like building blocks: combine the ones you need to create your own app behavior.

In this section, we will use plugins to extend the app.

### TOML File Format

Let's switch the configuration format to TOML.

1. TOML support is provided by the `bajo-config` plugin, so install it first:
   ```bash
   $ npm install bajo-config
   ```
2. Open `data/config/.plugins` and add `bajo-config` in it. If the file does not exist yet, create it first. Plugin order is usually resolved automatically by Bajo.
3. Remove `data/config/main.yml` and create `data/config/main.toml`.
4. Add the same object as before, now in TOML:
   ```
   firstName = "Tanjiro"
   lastName = "Kamado"
   age = 15
   ```
5. Run the app and check the result. It should match the previous behavior, except for different timestamps.

### Applet Mode

**Applets** are small tools embedded within plugins that run when Bajo is in **applet mode**. They have their own lifecycle, separate from the main program, but they can still reuse shared resources and config.

To run Bajo in applet mode, use `--applet` or `-a`:

```bash
$ node index.js -a
```

Applet mode needs `bajo-cli`, so install it first:

```bash
$ npm install bajo-cli
```

Then add `bajo-cli` to the `data/config/.plugins` file. Again, plugin order is not a concern in this case.

If you run it now, your terminal may show something like this:

```bash
ℹ App runs in applet mode
? Please select: (Use arrow keys)
❯ bajoConfig
  bajoCli
```

Notice that the app reports it is running in applet mode. The interface becomes an interactive CLI view, and regular logs are hidden.

By default, logs are disabled in applet mode to keep the console clean. During debugging, you can enable logs again by adding `--log-applet` to your command.

Applets are optional utilities provided by plugin authors, so it could be the case that some plugins have many applets in it while others have none.

### System Info

Now let's install one more plugin: `bajo-sysinfo`. It is a thin wrapper over [systeminformation](https://github.com/sebhildebrandt/systeminformation) with a few helpful additions:

- It can be called directly as an applet.
- It is also exposed as Waibu REST API endpoints. We will cover it much later.

If you run the app like this (yes, `--applet` can take a value; details are {@link module:Applet|here}, you may see output like the following after loading:

```bash
$ node index.js -a bajoSysinfo:battery
ℹ App runs in applet mode
ℹ Done!
┌──────────────────┬─────────────────────┐
│ hasBattery       │ true                │
├──────────────────┼─────────────────────┤
│ cycleCount       │ 0                   │
├──────────────────┼─────────────────────┤
│ isCharging       │ true                │
├──────────────────┼─────────────────────┤
│ designedCapacity │ 61998               │
├──────────────────┼─────────────────────┤
│ maxCapacity      │ 51686               │
├──────────────────┼─────────────────────┤
...
```

## More

Bajo offers much more beyond this tiny introduction. When you are ready, continue with these sub-framework guides below. In
the mean time, please feel free to also explore the {@tutorial 03_USER_GUIDE} and {@tutorial 04_DEV_GUIDE}.

- [Dobo DBMS](https://github.com/ardhi/dobo/wiki/GETTING-STARTED.md)
- [Waibu Web Framework](https://github.com/ardhi/waibu/wiki/GETTING-STARTED.md)
- [Sumba Biz Suites](https://github.com/ardhi/sumba/wiki/GETTING-STARTED.md)
- [Masohi Messaging](https://github.com/ardhi/masohi/wiki/GETTING-STARTED.md)
