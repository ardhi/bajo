# Getting Started

## Installation

Create a new empty directory named ```my-project```. This will become your project directory througout this tutorial. Now ```cd``` to your newly created directory, and type:

```bash
$ npm init
```

You'll be asked to name your project, put description, author infos etc. Please continue until
*package.json* file is created.

Open it using your favorite editor; edit and insert the following lines:

```javascript
...
  "type": "module",
  "bajo": {
    "type": "app"
  },
...
```

After completing those steps, install Bajo by hitting:

```bash
$ npm install bajo
```

Now create application bootstrap file ```index.js``` and put these lines below:

```javascript
// index.js file
import bajo from 'bajo'
await bajo()
```

A Bajo based app **ALWAYS** needs a data directory to put config files, etc. This could be located inside or outside your project directory. If this directory doesn't exist yet, Bajo will create
one for you: directory ```data``` in the same location of your ```index.js``` file. Bajo then by default set this directory as your data directory.

Bajo will also automatically create ```main``` directory that serves as your main plugin if it doesn't exist yet. A factory file named ```index.js``` will be added inside the ```main``` directory. More on this later in the next chapter.

Now run your app:

```bash
$ node index.js
```

Congratulations! Your Bajo based app is up and running!

## Playing arround

By now your directory structure should look like this (excluding ```node_modules``` dir):

```
|- my-project
|  |- data
|  |  |- config
|  |- main
|  |  |- index.js
|  |- index.js
|  |- package.json
|  |- package-lock.json
```

Your app by default runs in ```dev``` environment. In this environment, log level is set to ```debug```, which can be overridden by using program arguments:

```bash
$ node index.js --log-level=trace --log-timeTaken --log-pretty
```

Now Bajo will show you bunch of pretty, colorful logs including time taken of each steps. This is very useful for debugging purpose or to find out which activity took time the most.

But typing program arguments is boring, lets use config file to do some magic. Create ```data/config/bajo.json``` and put these lines in it:

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

Now try to simply run your app without any arguments:

```bash
$ node index.js
```

Much better! And hassel free!!

You can mix and match between config file and program arguments on any key-value pairs anytime anywhere. You even can laverage environment variables or using dotenv ```.env``` file if you really need to do. Please read [User Guide](04-user-guide.md) for more in-depth infos on this one.


## Your First Project

Let's start with **Hello World!**, the Bajo's style.