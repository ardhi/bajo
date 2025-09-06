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

