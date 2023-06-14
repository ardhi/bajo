# Bajo Framework

## Installation

> Note: you must have a proper install of ```node```, ```npm``` and/or ```yarn``` before

Open your terminal and type:

```
npm install bajo
# or
yarn add bajo
```

## Fire up!

Goto your project directory, create the ```index.js``` file and put this in it:

```js
const bajo = require('bajo')
bajo.boot()
  .then(scope => {
  })
  .catch(err => {
    console.trace(err)
  })
```

Bajo application **ALWAYS** need a data directory to put configuration files, etc. This
cloud be located inside or outside your project directory.

Lets assume you're going to put your data directory inside your project directory. So please
create a new directory called ```data``` first. After that, just type in your terminal:

```
node index.js --dir-data=data
```

Or you could use ```dotenv``` by creating ```.env``` file in the same directory as ```index.js```, and put this inside:

```
DIR_DATA = .\data
```

Now you can omit calling node with arguments, you just need to type:

```
node index.js
```

## Documentation

[API](https://ardhi.github.io/bajo)

## License

[MIT](LICENSE) License
