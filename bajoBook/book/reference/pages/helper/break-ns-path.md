---
title: function breakNsPath()
---

Bajo uses this common format ```<ns>:<path>``` everywhere to describe a path (variable, function name, etc) belongs to what namespace/plugin. This function helps you to get the right **ns** and **path** pair by validating named namespace.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```item``` | string | ```''``` | ```<ns>:<path>``` pair |

###### Returns:

```array``` of **ns** and **path**

#### Example

```javascript
...
const { breakNsPath } = this.bajo.helper
console.log(breakNsPath('bajoWeb:/my/path'))
// ['bajoWeb', '/my/path']
```
