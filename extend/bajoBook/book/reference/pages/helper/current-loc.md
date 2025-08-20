---
title: function currentLoc()
---

In ES 6, there is no *__dirname* nor *__filename*. This helper simply provides a simple way to get what you want

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```meta``` ||| imported meta |

###### Returns:

```object``` of
- ```dir```: current script directory
- ```file```: current script file
- ```__dirname```: alias of ```dir```
- ```__filename```: alias of ```file```

#### Example

```javascript
...
const { currentLoc } = this.bajo.helper
const { dir, file } = currentLoc(import.meta)
console.log(dir) // prints: '/home/me/apps/current/dir'
```