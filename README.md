# Bajo Framework

![GitHub package.json version](https://img.shields.io/github/package-json/v/ardhi/bajo) ![NPM Version](https://img.shields.io/npm/v/bajo)

## Installation

> Note: you must have a proper install of ```node```, ```npm``` and/or ```yarn``` before

Open your terminal and type:

```bash
$ npm install bajo
```

## Fire up!

Create a new empty directory, this will be your project directory or your ```<bajo-app-dir>```. Now goto your newly created directory, and type:

```bash
$ npm init
```

You'll be asked to name your project etc. **IMPORTANT**: don't forget to mark your project as ES6 project by setting ```type``` key in your ```package.json``` to ```module```.

After completing those steps, move on the the next one: crating bajo bootstrap.

Inside your ```<bajo-app-dir>```, create the ```index.js``` file and put these lines below in it:

```js
const bajo = require('bajo')
bajo.boot()
  .then(scope => {
  })
  .catch(err => {
    console.trace(err)
  })
```

A bajo app **ALWAYS** needs a data directory to put configuration files, etc. This
could be located inside or outside your ```<bajo-app-dir>```.

Lets assume you're going to put your data directory inside your ```<bajo-app-dir>```. So please
create a new directory called ```data``` first. After that, just type in your terminal:

```bash
$ node index.js --dir-data=data
```

Or you could use ```dotenv``` by creating ```.env``` file in the same directory as ```index.js```, and put this inside:

```
DIR_DATA = ./data
```

Now you can omit calling node with arguments, you just need to type:

```bash
$ node index.js
```

## Ecosystem

- [bajo-emitter](https://github.com/ardhi/bajo-emitter)
- [bajo-mqtt](https://github.com/ardhi/bajo-mqtt)
- [bajo-udp](https://github.com/ardhi/bajo-udp)

## License

[MIT](LICENSE)
