---
title: function dump()
---

A ```console.log``` with untruncated, deep objects. Doesn't return anything, instead prints arguments as nested, deep object.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```...args``` | ...object || rest parameter of objects |

###### Returns:

```void```

#### Example

```javascript
...
const { dump } = this.bajo.helper
const value = {
  level1: {
    level2: {
      level3: {
        level4: 'this is a test'
      }
    }
  }
}
dump(value)
```
