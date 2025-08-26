# Config Object

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```log``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;```dateFormat``` | ```string``` | ```YYYY-MM-DDTHH:MM:ss.SSS[Z]```| See [dayjs string & format](https://day.js.org/docs/en/parse/string-format) for more info |
| &nbsp;&nbsp;&nbsp;&nbsp;```plain``` | ```boolean``` | ```false```| No color, simple styling |
| &nbsp;&nbsp;&nbsp;&nbsp;```applet``` | ```boolean``` | ```false```| Activate log even in applet mode |
| ```lang``` | ```string``` | Auto detected | Valid language code e.g: 'en-US', 'id', etc. |
| ```intl``` | ```object``` | | Internationalization settings |
| &nbsp;&nbsp;&nbsp;&nbsp;```supported``` | ```array``` | ```['en-US', 'id']``` | Supported languages |
| &nbsp;&nbsp;&nbsp;&nbsp;```fallback``` | ```string``` | ```en-US``` | Language to use if one isn't valid |
| &nbsp;&nbsp;&nbsp;&nbsp;```format``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```emptyValue``` | ```string``` | ```''``` | Value to use if value is ```null``` or ```undefined``` |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```datetime``` | ```object``` | ```{ dateStyle: 'medium', timeStyle: 'short' }``` | See [this link](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) for more |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```date``` | ```object``` | ```{ dateStyle: 'medium' }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```time``` | ```object``` | ```{ dateStyle: 'short' }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```float``` | ```object``` | ```{ maximumFractionDigits: 2 }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```double``` | ```object``` | ```{ maximumFractionDigits: 5 }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```smallint``` | ```object``` | ```{}``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```integer``` | ```object``` | ```{}``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;```unitSys``` | ```object``` | | Enter new key-value for specific language. If not specified, value defaults to ```metric```. Accepted values: ```imperial```, ```metric```, ```nautical``` |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```en-US``` | ```string``` | ```imperial``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```id``` | ```string``` | ```metric``` | |
| ```exitHandler``` | ```boolean``` | ```true``` | If ```false```, no graceful shutdown |
| ```env``` | ```string``` | ```dev``` | Acceptable values: ```dev```, ```staging```, ```prod``` |
| ```silent``` | ```boolean``` | ```false``` | If ```false```, suppress all messages. Incl. app log |
