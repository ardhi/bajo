---
title: function getConfig()
---

Get configuration object of **bajo** or its **plugin**

###### Parameters:

| Name | Type | Default&nbsp;Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```name``` | string | ```bajo``` | A valid plugin name |
| ```options``` | object |||
| &nbsp;&nbsp;&nbsp;&nbsp;```full``` | boolean | ```false``` | If ```true```, returns ALL config objects belonging to named plugin. Otherwise, returns only subset of objects that can be changed through configuration file |
| &nbsp;&nbsp;&nbsp;&nbsp;```clone``` | boolean | ```false``` | If ```true```, returns cloned object |

###### Returns:

```object```

#### Example

```javascript
...
const { getConfig } = this.bajo.helper
const cfg = getConfig('bajoLogger')
console.log(cfg)
```
