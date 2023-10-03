---
title: Instalation & Setup
---

Installation is quite straight forward; in your app project directory, enter following command:

```sh
$ npm install bajo-book
```

Then in your data directory, find ```config``` folder and add the package in ```bajo.json``` file:

```json
{
  "log": {
    "level": "debug"
  },
  "plugins": ["bajo-db", "bajo-web", "bajo-web-mpa", "bajo-web-static", "bajo-book"]
}
```

After app restart, all books found in plugins will be rebuilt and displayed as web pages in ```/book``` mountpoint (or any prefix you've put in ```bajoBook.json```)
