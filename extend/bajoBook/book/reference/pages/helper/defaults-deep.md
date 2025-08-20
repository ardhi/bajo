---
title: function defaultsDeep()
---

Similar to lodash's [defaultsDeep](https://lodash.com/docs/4.17.15#defaultsDeep), but without mutating the source object, and no merging of arrays.

Based on [@nodeutils/defaults-deep](https://github.com/nodeutils/defaults-deep), customized to work
in Bajo environment

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```...args``` | ...object || rest parameter of objects |

###### Returns:

```object``` of merged argument's objects


#### Example

```javascript
...
const { defaultsDeep } = this.bajo.helper
const a = { one: 1, two: 2 }
const b = { one: 'one', three: 'three' }
console.log(defaultsDeep(b, a)) // returns: { one: 'one', two: 2, three: 'three' }
```
