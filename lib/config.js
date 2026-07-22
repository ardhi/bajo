/**
 * This is the default configuration object for Bajo and its plugins (see note below). It contains various settings that control the behavior of the framework.
 * You can override these settings by providing your own configuration object through the following methods in the order of priority:
 * 1. **Environment variables**:
 *    You can set configuration options using environment variables too. `dotenv` is also supported.
 *    The environment variable names should be in uppercase. Use double underscores instead of dots and single underscores
 *    to form camel cased name. For example, `LOG__TIME_TAKEN=true` will set `log.timeTaken` to `true`
 * 2. **Command-line arguments**:
 *    You can pass configuration options as command-line arguments when starting the application. For example, you can use `--env=prod` to set the environment to `prod`.
 *    For nested configuration options, use dash notation. For example, `--log-timeTaken` will set `log.timeTaken` to `true`.
 * 3. **Configuration files**:
 *    Create/open `{dataDir}/config/bajo.{ext}` file, where `{ext}` is the file extension of your choice.
 *    This file is read during the boot process with app's {@link App#configHandlers} and merged with the default configuration object.
 *
 *    By default, the supported file extensions are `.js`, `.json`, and `.yml/.yaml`. More extensions can be added by plugins.
 *    For example, the {@link https://ardhi.github.io/bajo-config bajo-config} plugin provides support for `.toml` format.
 *
 *    If the same filename with different extension exists, the one with higher priority will be used. The priorities are as follows:
 *    1. `.js` - use this if you want to use dynamic config file that can be generated programmatically.
 *    2. `.json` - use this if you want to use static config file that can be easily edited by humans.
 *    3. `.yml/.yaml` - use this if you want to use static config file that can be easily edited by humans and supports comments.
 *
 *    To have an environment-specific configuration, create a file named `bajo-{env}.{ext}` where `{env}` is the environment name (e.g. `dev`, `prod`)
 *    in the same folder.
 *
 * > **Note**: all plugin's configuration files follow the same rules as above, but with the following differences:
 * > - The configuration file should be named as `{pluginName}.{ext}` or `{pluginName}-{env}.{ext}` for environment-specific configuration, where `{pluginName}` is the name of the plugin.
 * > - Command-line arguments should be prefixed with the plugin name followed by a colon. For example, `--{pluginName}:my-configKey` will set `my.configKey` to the value provided for the plugin's configuration.
 * > - Environment variables should be prefixed with the plugin name followed by a dot. For example, `{PLUGINNAME}.MY__CONFIG_KEY` will set `my.configKey` to the value provided for the plugin's configuration.
 * >
 * > Plugin's configuration objects are mutable only during the boot process. After a plugin is started, they are frozen and cannot be modified.
 * Your only options to do modifications is to use `{pluginName}:{before|after}{Init|Start}` hooks.
 *
 * @typedef TConfig
 * @global
 * @type {Object}
 */

/**
 * @typedef TConfig
 * @memberof Bajo
 * @type {Object}
 * @property {string} env - Environment name (`dev` or `prod`)
 * @property {Object} [runtime={}] - Runtime configuration
 * @property {boolean} [runtime.noWarning=false] - If `true`, Bajo will not show any warning messages. Default is `false`
 * @property {Object} [log={}] - Logging configuration
 * @property {boolean} [log.timeTaken=false] - If `true`, Bajo will log the time taken for each operation. Default is `false`
 * @property {string} [log.dateFormat='YYYY-MM-DDTHH:mm:ss.SSS'] - Date format for logging
 * @property {boolean} [log.useUtc=false] - If `true`, Bajo will use UTC instead of local time for logging. Default is `false`
 * @property {boolean} [log.pretty=false] - If `true`, Bajo will use pretty logging format. Default is `false`
 * @property {boolean} [log.applet=false] - Whether to log when in applet mode or not. Default is `false`
 * @property {boolean} [log.save=false] - Whether to save logs to file. Default is `false`
 * @property {Object} [log.rotation={}] - Log rotation configuration, used only if `log.save` is `true`
 * @property {string} [log.rotation.cycle='none'] - Rotation cycle (`none`, `daily`, `weekly`, `monthly`). Default is `none`
 * @property {boolean} [log.rotation.compressOld=true] - Whether to compress old logs. Default is `true`
 * @property {boolean} [log.rotation.byPlugin=false] - Whether to rotate logs by plugin. Default is `false`
 * @property {number} [log.rotation.retain=5] - Number of old logs to retain. Default is `5`
 * @property {Object} [dump={}] - Dump configuration
 * @property {number} [dump.depth=2] - Depth of object to dump. Default is `2`
 * @property {boolean} [dump.compact=false] - If `true`, Bajo will dump objects in compact format. Default is `false`
 * @property {boolean} [dump.colors=true] - If `true`, Bajo will dump objects with colors. Default is `true`
 * @property {number} [dump.breakLength=80] - Break length for dumping objects. Default is `80`
 * @property {boolean} [dump.caller=true] - If `true`, Bajo will dump the caller of the dump function. Default is `true`
 * @property {Object} [dump.frame={}] - Display frame configuration for dumping objects
 * @property {string} [dump.frame.titleAlignment='center'] - Title alignment for dumping objects. Default is `center`
 * @property {number} [dump.frame.padding=1] - Padding for dumping objects. Default is `1`
 * @property {number} [dump.frame.margin=1] - Margin for dumping objects. Default is `1`
 * @property {string} [dump.frame.borderStyle='round'] - Border style for dumping objects. Default is `round`
 * @property {string} [lang] - Default language for internationalization. Default is the system language or `en-US` if not available
 * @property {Object} [intl={}] - Internationalization configuration
 * @property {string[]} [intl.supported=['en-US', 'id']] - Supported languages. Default is `en-US` and `id`. Add more if you want it
 * @property {string} [intl.fallback='en-US'] - Fallback language if the requested language is not supported. Default is `en-US`
 * @property {string[]} [intl.lookupOrder=[]] - Lookup order for languages. Default is empty array
 * @property {Object} [intl.format={}] - Formatting configuration
 * @property {string} [intl.format.emptyValue=''] - Value to use for empty values. Default is empty string
 * @property {Object} [intl.format.datetime] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat|Intl.DateTimeFormat} for more information
 * @property {Object} [intl.format.date] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat|Intl.DateTimeFormat} for more information
 * @property {Object} [intl.format.time] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat|Intl.DateTimeFormat} for more information
 * @property {Object} [intl.format.float] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|Intl.NumberFormat} for more information
 * @property {Object} [intl.format.double] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|Intl.NumberFormat} for more information
 * @property {Object} [intl.format.smallint] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|Intl.NumberFormat} for more information
 * @property {Object} [intl.format.integer] - See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|Intl.NumberFormat} for more information
 * @property {Object} [intl.unitSys={}] - Unit system configuration. Object with keys as language codes and values as unit systems. Supported values are `metric`, `imperial` and `nautical`
 * @property {string} [intl.unitSys.en-US='imperial'] - Unit system for `en-US`. Default is `imperial`
 * @property {string} [intl.unitSys.id='metric'] - Unit system for `id`. Default is `metric`
 * @property {boolean} [exitHandler=true] - Whether to attach exit handlers for graceful shutdown. Default is `true`
 * @property {Object} [cache={}] - Cache configuration
 * @property {string[]} [cache.purge=[]] - List of cache names to purge on startup. Default is empty array
 * @property {string|number} [cache.purgeIntvDur='5m'] - Interval duration for purging cache. Default is `5m`
 */
const config = {
  env: 'dev',
  runtime: {
    noWarning: false
  },
  log: {
    timeTaken: false,
    dateFormat: 'YYYY-MM-DDTHH:mm:ss.SSS',
    useUtc: false,
    pretty: false,
    applet: false,
    save: false,
    rotation: {
      cycle: 'none', // none, daily, weekly, monthly
      compressOld: true,
      byPlugin: false,
      retain: 5
    }
  },
  dump: {
    depth: 2,
    compact: false,
    colors: true,
    breakLength: 80,
    caller: true,
    frame: {
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round'
    }
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  intl: {
    supported: ['en-US', 'id'],
    fallback: 'en-US',
    lookupOrder: [],
    format: {
      emptyValue: '',
      datetime: {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC'
      },
      date: {
        dateStyle: 'medium',
        timeZone: 'UTC'
      },
      time: {
        timeStyle: 'short',
        timeZone: 'UTC'
      },
      float: {
        maximumFractionDigits: 2
      },
      double: {
        maximumFractionDigits: 5
      },
      smallint: {},
      integer: {}
    },
    unitSys: {
      'en-US': 'imperial',
      id: 'metric'
    }
  },
  exitHandler: true,
  cache: {
    purge: [],
    purgeIntvDur: '5m'
  }
}

export default config
