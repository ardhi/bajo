Configuration file should be placed inside app data directory: ```<data dir>/config/bajo.json```. Supported format: **.json** and **.js** file. If you use ```bajo-config```, you can also write config
file in YAML or TOML format. But we recommend to stick with good old JSON file.

The following table lists all keys used to control running app:

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| ```dir``` | object |||
| &nbsp;&nbsp;&nbsp;&nbsp;```base``` | string | _Autodetect_ | Your app base directory. _Readonly_ |
| &nbsp;&nbsp;&nbsp;&nbsp;```pkg``` | string | _Autodetect_ | **bajo** package directory. _Readonly_ |
| &nbsp;&nbsp;&nbsp;&nbsp;```data``` | string | ```data``` sub directory under ```dir.base``` | Your data directory. Can be anywhere in your file system |
| &nbsp;&nbsp;&nbsp;&nbsp;```tmp``` | string | Sub directory ```bajo``` in your default OS temp directory | Temp directory. Can be anywhere in your file system |
| ```log``` | object |||
| &nbsp;&nbsp;&nbsp;&nbsp;```level``` | string | ```debug``` | Log level. Choices: **trace**, **debug**, **info**, **warn**, **error**, **fatal**, **silent** |
| &nbsp;&nbsp;&nbsp;&nbsp;```dateFormat``` | string | ```YYYY-MM-DDTHH:MM:ss.SSS[Z]``` | Using Pino format |
| &nbsp;&nbsp;&nbsp;&nbsp;```tool``` | boolean | ```false``` | If _true_ log will still be shown even when app is running in **sidetool** mode |
| ```lang``` | string | ```en-US``` | Language used |
| ```env``` | string | ```dev``` | Running environment: **prod** for production, **dev** for development |
| ```plugins``` | array | ```['app']``` | List of plugins used by your app |
| ```exitHandler``` | boolean | ```true``` | If _true_, error will be handled automatically |

#### Example

Using JSON file:

```json
{
  "dir": {
    "data": "/home/me/app/data"
  },
  "log": {
    "level": "trace"
  },
  "lang": "id"
}
```

Using JS file:

```javascript
async function () {
  return {
    dir: {
      data: '/home/me/app/data'
    },
    log: {
      level: 'trace'
    },
    lang: 'id'
  }
}
```
