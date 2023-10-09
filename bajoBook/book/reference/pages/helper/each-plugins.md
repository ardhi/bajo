---
title: async function eachPlugins()
---

Walk through all loaded plugins and execute the callback handler.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```handler``` | async function || callback handler. _Required_ |
| ```options``` | object |||
| &nbsp;&nbsp;&nbsp;&nbsp;```key``` | string | ```name``` | Key of Bajo's config object that will be used as the key of returned object |
| &nbsp;&nbsp;&nbsp;&nbsp;```glob``` | string/object || see above |
| &nbsp;&nbsp;&nbsp;&nbsp;```ns``` | string | _Autodetect_ | If not set, it defaults to calling plugin |
| &nbsp;&nbsp;&nbsp;&nbsp;```extend``` | string || see above |
| &nbsp;&nbsp;&nbsp;&nbsp;```extendHandler``` | function | ```handler``` | see above |
| &nbsp;&nbsp;&nbsp;&nbsp;```useBajo``` | boolean | ```false``` | weather to scan **bajo** package dir too |

###### Returns:

```object```

#### Example
