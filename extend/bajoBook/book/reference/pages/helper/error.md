---
title: function error()
---

A shortcut to create an instance of Error with message and optionally rest parameter within a single line.

Message can hold ```sprintf``` token. If it does, use rest parameter to replace its token.

If last parameter is a plain object, it will be used as error payload.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```message``` | string || Error message. _Required_ |
| ```...args``` | ...any || see above |

###### Returns:

```object``` new instance of node's Error

#### Example

```javascript
...
const { error } = this.bajo.helper
const payload = { statusCode: 500, details: [{ field: 'username', error: 'Required' }] }
throw error('This is a %s error, it should also hold some payloads', 'fatal', payload)
```