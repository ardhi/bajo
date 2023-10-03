---
title: function generateId()
---

ID generator based on [nanoid](https://github.com/ai/nanoid).

By default, ```options.pattern``` is set to ```abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789``` so that resulted ID will be a full alphanumeric characters with the length of ```options.length``` (default: ```21```)

If ```options.pattern``` is an object:

- ```pattern```: characters to use
- ```lowerCase```: if ```true```, only use lowercase
- ```upperCase```: if ```true```, only use uppercase

```lowerCase``` and ```upperCase``` is mutually exclusive, first one win.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```options``` | object |||
| &nbsp;&nbsp;&nbsp;&nbsp;```pattern``` | string or object | all alphanumeric characters | see above |
| &nbsp;&nbsp;&nbsp;&nbsp;```length``` | integer | ```21``` | length of generated ID |
| &nbsp;&nbsp;&nbsp;&nbsp;```returnInstance``` | boolean | ```false``` | Set ```true``` to return a nanoid instance |

###### Returns:

```string``` or ```object```

#### Example

```javascript
...
const { generateId } = this.bajo.helper
console.log(generateId()) // returns: <randomly generated characters>
```