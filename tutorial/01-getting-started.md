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

### Tapping a Hook

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

Bajo is designed to be an ecosystem with many small plugins. Think of Lego blocks: you build a structure just by picking up the right ones and sticking them together to create your very own structure.

In this series, we'll learn how to use such plugins to extend our app.

### File Format

We love YAML format so much so let's use it for our configuration file:

1. YAML support is part of the ```bajo-config``` plugin, so we need to install it first
   ```bash
   $ npm install bajo-config
   ```
2. Now, open the ```data/config/.plugins``` file and put ```bajo-config``` in it, line by line. If it doesn't exist yet, create it first. Don't worry about the order; Bajo will figure it out automatically if you have many plugins.
3. Delete your old configuration file ```data/config/main.json``` and create a new ```data/config/main.yml```. By the way, it doesn't matter whether you use ```.yml``` or ```.yaml```. Both are supported.
4. Enter the following lines, it should be the same object as before, just in YAML format:
   ```yaml
   firstName: Tanjiro
   lastName: Kamado
   age: 15
   ```
5. Run and check the output. It should be the exact same output as before, except for the log's timestamps.

### Applet Mode

**Applets** are small tools embedded in plugins that can be invoked when Bajo is running in **applet mode**. Their lifecycle is totally independent of the main program, but they can reuse the same resources and config objects.

You can run Bajo in applet mode by using the ```--applet``` or ```-a``` switches:

```bash
$ node index.js -a
```

But applet mode requires you to install ```bajo-cli``` beforehand. So, please install it first:

```bash
$ npm install bajo-cli
```

Don't forget to add ```bajo-cli``` to the ```data/config/.plugins``` file. Again, the order doesn't really matter here.

If you run it now, you'll see something like this on your terminal:

```bash
ℹ App runs in applet mode
? Please select: (Use arrow keys)
❯ bajoConfig
  bajoCli
```

The first thing to notice is the information that the app is running in applet mode. It's a normal command-line application with a pretty decent UI, and all the logs are gone!

By default, logs are turned off in applet mode to give you a clear and distraction-free console. However, during debugging, you might want to turn them on. How? Simply add the ```--log-applet``` switch to your invocation, and your logs will be printed everywhere again.

Applets are a way for a Bajo plugin developer to help you by providing small tools for everyday life. It's up to the plugin developer to provide such applets, so don't be surprised if you don't get any built-in applets with some plugins.

### System Info

Let's install one more plugin: ```bajo-sysinfo```. This plugin is a thin wrapper around [systeminformation](https://github.com/sebhildebrandt/systeminformation) with a few twists:

- It can be called directly as an applet.
- It is also exported as Waibu REST API endpoints. We'll cover this later in the tutorial.

If you try to run your app as shown below (yes, you can have a value for the applet switch; for more details, please [see here](https://github.com/ardhi/bajo-cli)), you'll see something like this after the loading spinner stops:

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

## Database

Bajo has its own sub-framework called **Dobo** for handling database management. In this tutorial, we'll go over how to install the necessary packages and interact with them. For more information about Dobo, please [click here](https://ardhi.github.io/dobo).

Here is some basic knowledge about Dobo you need to be familiar with:

- All record-related actions mimic REST API methods: *find* records, *get* a particular record by its ID, *create* a new record, *update* an existing record by ID and payload, and *remove* an existing record by its ID.
- A Dobo model requires a predefined schema. Even if you use a NoSQL database, you still need to write a schema.
- There are two main groups of methods to be familiar with:
  - ```dobo.model{Action}``` methods manage everything related to model management, such as table creation or deletion.
  - ```dobo.record{Action}``` methods handle record manipulation.
- A record in Bajo always needs to have an ID. The ID can be alphanumeric characters or an integer, and it is defined by the underlying driver used by the model.

For more info about Dobo, please [click here](https://ardhi.github.io/dobo).

### Installation

As you might have guessed, Dobo and its drivers are normal Bajo plugins. Although [many drivers](https://github.com/ardhi/dobo/tutorials/drivers.md) exist, for this tutorial, we'll only use SQLite 3, which is provided by the dobo-knex driver.

Now, please install the required plugins and SQLite drivers first:

```bash
$ npm install dobo dobo-knex sqlite3
```

Don't forget to add ```dobo``` and ```dobo-knex``` to the ```data/config/.plugins``` file.

### Model

Let's pretend we're building an address book with fields like name, age, phone, etc. This entity needs to be modeled with a schema and then "connected" to a database:

1. Create ```main/extend/dobo/schema/address-book.json``` file.
2. Enter the following schema:
   ```json
   {
     "properties": [{
       "name": "firstName",
       "type": "string",
       "maxLength": 20,
       "required": true,
       "index": true
     },
       "lastName::20:true:true",
       "age:smallint",
       "phone::20:true:true",
       "email::50:true"
     ],
     "feature": {
       "createdAt": true,
       "updatedAt": true
     }
   }
   ```
   You should notice here that in properties you can use either the verbose, full-object syntax or the string-based one. Please visit the Dobo documentation to learn more.

3. Create ```main/extend/dobo/fixture/address-book.json``` file. Fixtures allow you to quickly fill your database with predefined records. It's not required, but it helps a lot with prototyping.
   ```json
   [{
     "firstName": "James",
     "lastName": "Bond",
     "phone": "+44-007"
   }, {
     "firstName": "Felix",
     "lastName": "Leiter",
     "age": 50,
     "phone": "+1-0000001"
   }]
   ```
4. By default, all schemas are connected to a database connection named ```default```. Now let's create this connection by creating ```data/config/dobo.json``` file:

   ```json
   {
     "connections": [{
       "name": "default",
       "type": "knex:sqlite3",
       "connection": {
         "filename": "my-project.sqlite3"
       }
     }]
   }
   ```
5. That's all there is to it. Now you need to build this model like this:
   ```
   $ node index.js -a dobo:modelRebuild MainAddressBook
   ℹ App runs in applet mode
   ╭ Schema (1) ──────╮
   │ MainAddressBook  │
   ╰──────────────────╯
   ✔ The above mentioned schema(s) will be rebuilt as model. Continue? Yes
   ✔ Model 'MainAddressBook' successfully created
   ℹ Done! Succeded: 1, failed: 0, skipped: 0
   ✔ Fixture on 'MainAddressBook': added 2, rejected: 0
   ```
6. Done!

Note: Although you can use YAML or TOML for schemas/fixtures, it's recommended to stick with JSON because it's always supported and doesn't require an extra plugin.

Dobo models are by default always named with ```{Alias}{ModelName}```, which is a pascal-cased plugin alias and base name from your schema file. For field names, Dobo use camel-cased names as a convention. You can change this behavior to match your needs, but it is suggested that you're keeping these conventions at least for this tutorial.

### Applets

Dobo provides you with a number of applets that will help you manipulate models and records directly. This means you don't have to touch your tables and databases directly through SQL statements or NoSQL procedures ever again. Everything can be managed through one common syntax provided by Dobo, regardless of your backend type.

First, let's try to list records:

```bash
$ node index.js -a dobo:recordFind MainAddressBook
ℹ App runs in applet mode
✔ Please enter your query (if any):
✔ Done
┌────┬───────────┬──────────┬─────┬────────────┬───────┬──────────────────────────┬──────────────────────────┐
│ id │ firstName │ lastName │ age │ phone      │ email │ createdAt                │ updatedAt                │
├────┼───────────┼──────────┼─────┼────────────┼───────┼──────────────────────────┼──────────────────────────┤
│ 2  │ Felix     │ Leiter   │ 50  │ +1-0000001 │       │ 2025-09-18T13:47:29.296Z │ 2025-09-18T13:47:29.296Z │
├────┼───────────┼──────────┼─────┼────────────┼───────┼──────────────────────────┼──────────────────────────┤
│ 1  │ James     │ Bond     │     │ +44-007    │       │ 2025-09-18T13:47:29.280Z │ 2025-09-18T13:47:29.280Z │
└────┴───────────┴──────────┴─────┴────────────┴───────┴──────────────────────────┴──────────────────────────┘
```

Now, add a new record:

```bash
$ node index.js -a dobo:recordCreate MainAddressBook
ℹ App runs in applet mode
✔ Enter JSON payload: { "firstName": "Miss", "lastName": "Moneypenny" }
╭ MainAddressBook ────────────╮
│ {                           │
│   "firstName": "Miss",      │
│   "lastName": "Moneypenny"  │
│ }                           │
╰─────────────────────────────╯
✖ Error: Validation Error
✔ Enter JSON payload: { "firstName": "Miss", "lastName": "Moneypenny", "phone": "+44-111" }
╭ MainAddressBook ─────────────╮
│ {                            │
│   "firstName": "Miss",       │
│   "lastName": "Moneypenny",  │
│   "phone": "+44-111"         │
│ }                            │
╰──────────────────────────────╯
✔ Done
┌───────────┬──────────────────────────┐
│ id        │ 3                        │
├───────────┼──────────────────────────┤
│ firstName │ Miss                     │
├───────────┼──────────────────────────┤
│ lastName  │ Moneypenny               │
├───────────┼──────────────────────────┤
│ age       │                          │
├───────────┼──────────────────────────┤
│ phone     │ +44-111                  │
├───────────┼──────────────────────────┤
│ email     │                          │
├───────────┼──────────────────────────┤
│ createdAt │ 2025-09-18T14:38:11.933Z │
├───────────┼──────────────────────────┤
│ updatedAt │ 2025-09-18T14:38:11.933Z │
└───────────┴──────────────────────────┘
```

As you can see, Dobo is smart enough to reject any payload that isn't right. In this case, we forgot to include the phone number since according to the schema, this field is defined as required.

You can now try all of Dobo's other applets. [This page](https://github.com/ardhi/dobo/tutorials/applets) provides its complete list.

## Web Framework

Bajo also has a sub-framework for serving the web called [Waibu](https://ardhi.github.io/waibu).

[Fastify](https://fastify.dev) and its ecosystem have been chosen as the web engine. Fastify is known to be one of the fastest, most solid, and robust web frameworks available for Node.js. Waibu wraps Fastify and its plugins to work like the Bajo plugin system and introduces several methods to make working with Fastify easier and more enjoyable.

To install Waibu and its dependencies, do this:

```bash
$ npm install waibu bajo-extra
```

and add ```waibu``` and ```bajo-extra``` to ```data/config/.plugins``` file.

By default, Waibu listens on host ```127.0.0.1``` and port ```7771```, so you can open your favorite browser and point it to the URL ```http://localhost:7771```.

A web framework is a very broad topic on its own. To make it more manageable, Waibu introduces the concept of a web app: a normal Bajo plugin that extends Waibu by providing a very specific task.

### Static Resources

The first web app to note is the one that serves static resources, [waibu-static](https://github.com/ardhi/waibu-static). Installation is very straightforward:

```
$ npm install waibu-static
```

and again, don't forget to add ```waibu-static``` to ```data/config/.plugins``` file.

#### Static Assets

This plugin serves static assets:
- With the route path ```/asset/{ns-prefix}/*```.
- Static assets are served from the ```{plugin-dir}/extend/waibuStatic/asset directory```.
- Where ```{ns-prefix}``` is a prefix string defined by its corresponding plugin. If this prefix is missing, it defaults to the plugin's alias.
- And ```{plugin-dir}``` is the plugin's base directory.

Now, create the ```main/extend/waibuStatic/asset``` directory and add some static assets to it. For example, let's create ```main/extend/waibuStatic/asset/hello.txt``` and add some text.

```bash
$ node index.js --log-level=trace
...
2025-09-19T01:09:42.338Z +11ms INFO: waibu Server is ready
2025-09-19T01:09:42.346Z +8ms TRACE: waibu Loaded routes
2025-09-19T01:09:42.346Z +0ms TRACE: waibu - /asset* (OPTIONS)
2025-09-19T01:09:42.347Z +1ms TRACE: waibu - /asset/main/* (HEAD|GET)
2025-09-19T01:09:42.347Z +0ms TRACE: waibu - /asset/static/* (HEAD|GET)
2025-09-19T01:09:42.348Z +1ms TRACE: waibu - /asset/~/bajo/dayjs/* (HEAD|GET)
...

```

If you visit ```http://localhost:7771/asset/main/hello.txt```, you'll get the same exact content you just typed above.

#### Virtual Assets

In the app logs above, you might be wondering what route paths starting with ```/asset/~/{ns}``` are all about. In ```waibu-static``` terms, it's called virtual assets. It's a way to export any directory within a plugin to be served as static assets.

Imagine you're writing a plugin that needs a specific package called ```hybrid-pkg``` from npm, and your frontend needs the exact same package. Without virtual assets, you would have to copy the exported files or directory to your plugin's asset directory. With virtual assets, you only need to do the following:

1. Create ```{your-plugin-ns}/extend/waibuStatic/virtual.json```
2. Enter the following items into the file:
   ```json
   [{
     "prefix": "hybrid-pkg",
     "root": "node_modules/hybrid-pkg/dist"
   }]
   ```
   The above statement instructs virtual assets to create the route path ```/asset/~/{your-plugin-prefix}/hybrid-pkg/*``` that is mapped to ```{your-plugin-dir}/node_modules/hybrid-pkg/dist```
3. Restart your app

Now you can use the same resource for frontend. Your request will be in the form of ```http://localhost:7771/asset/~/{your-plugin-prefix}/hybrid-pkg/file.js```

