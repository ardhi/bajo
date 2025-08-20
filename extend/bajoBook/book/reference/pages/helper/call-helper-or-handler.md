---
title: async function callHelperOrHandler()
---

Helper that call a function based on 1st parameter supplied:

- if it a function (handler), than it will be call it right away.
- if it a string and a valid helper name, it will call its underlaying function.

Any other parameters will be passed through as its arguments

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```nameOrFn``` | string or function || see above |
| ```...args``` | ```any``` || rest parameter |

###### Returns:

```any```


#### Example

```javascript
...
const { callHelperOrHandler } = this.bajo.helper

const add = (a, b) => a + b
const newId = 'bajo:generateId'

console.log(await callHelperOrHandler(add, 5, 6)) // returns: 11
console.log(await callHelperOrHandler(newId)) // returns: '<generated id>'
```
