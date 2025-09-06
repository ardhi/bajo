# Config Object

The following table shows the default app settings. To change these to suit your needs, please refer to **Getting Started**

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```log``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;```dateFormat``` | ```string``` | ```YYYY-MM-DDTHH:MM:ss.SSS[Z]```| See [dayjs string & format](https://day.js.org/docs/en/parse/string-format) for more info |
| &nbsp;&nbsp;&nbsp;&nbsp;```timeTaken``` | ```boolean``` | ```false```| Show time taken from previous activity in ms |
| &nbsp;&nbsp;&nbsp;&nbsp;```localDate``` | ```boolean``` | ```false```| Use local date, defaults: UTC |
| &nbsp;&nbsp;&nbsp;&nbsp;```pretty``` | ```boolean``` | ```false```| Colorful, pretty styling |
| &nbsp;&nbsp;&nbsp;&nbsp;```applet``` | ```boolean``` | ```false```| Show log even in applet mode |
| ```lang``` | ```string``` | Auto detected | Valid language code e.g: 'en-US', 'id', etc. |
| ```intl``` | ```object``` | | Internationalization settings |
| &nbsp;&nbsp;&nbsp;&nbsp;```supported``` | ```array``` | ```['en-US', 'id']``` | Supported languages |
| &nbsp;&nbsp;&nbsp;&nbsp;```fallback``` | ```string``` | ```en-US``` | Language to use if the selected one isn't valid |
| &nbsp;&nbsp;&nbsp;&nbsp;```format``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```emptyValue``` | ```string``` | ```''``` | Value to use if value is ```null``` or ```undefined``` |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```datetime``` | ```object``` | ```{ dateStyle: 'medium', timeStyle: 'short' }``` | See [this link](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) for more |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```date``` | ```object``` | ```{ dateStyle: 'medium' }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```time``` | ```object``` | ```{ dateStyle: 'short' }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```float``` | ```object``` | ```{ maximumFractionDigits: 2 }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```double``` | ```object``` | ```{ maximumFractionDigits: 5 }``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```smallint``` | ```object``` | ```{}``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```integer``` | ```object``` | ```{}``` | See above |
| &nbsp;&nbsp;&nbsp;&nbsp;```unitSys``` | ```object``` | | Add new language if necessary. If not specified, value defaults to ```metric```. Accepted values: ```imperial```, ```metric```, ```nautical``` |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```en-US``` | ```string``` | ```imperial``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```id``` | ```string``` | ```metric``` | |
| ```exitHandler``` | ```boolean``` | ```true``` | If ```false```, no graceful shutdown |
| ```env``` | ```string``` | ```dev``` | Acceptable values: ```dev```, or ```prod``` |
