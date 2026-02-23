# Changes

## 2026-02-23

- [2.6.1] Bug fix on ```readConfig()```
- [2.6.1] Bug fix on ```base.loadConfig()```

## 2026-02-20

- [2.6.0] Upgrade to ```aneka@0.12.0```
- [2.6.0] Add ```te()```
- [2.6.0] Bug fix on ```formatErrorDetails()``` in ```Err``` class

## 2026-02-08

- [2.5.0] Bug fix on handling log for ```error``` level
- [2.5.0] Add ```log.getErrorMessage()``` to get the right value of error message
- [2.5.0] Add ```timeZone``` in config for datetime data type

## 2026-01-29

- [2.4.0] Hooks can now be added through ```config``` object. This is specially usefull if you provide a custom config object on app boot
- [2.4.1] Bug fix on ```runHook()``` resolver. Source defaults to ```main``` if not provided. Scope defaults to ```bajo``` if not found/initialized yet
- [2.4.2] Bug fix on getting wrongly parsed ```env``` value

## 2026-01-24

- [2.3.2] Hook now can be executed without waiting if property ```noWait``` is ```true```

## 2026-01-21

- [2.3.1] Bug fix on keys that needs to be used while reading plugin's config files

## 2026-01-18

- [2.3.0] ```App``` constructor now accept an object as its parameter. For details, please see documentation
- [2.3.0] Package upgrade to ```aneka@0.11.0```
- [2.3.0] Bug fix on ```checkDependencies()```

## 2026-01-16

- [2.2.1] Bug fix on multiple appearance of loaded plugins info
- [2.2.1] Bug fix on ```app.lib.parseObject()``` wrapper

## 2026-01-11

- [2.2.0] Simplify numerous things by putting most of static properties back as normal class properties

## 2025-12-29

- [2.2.0] Add ```this.selfBind()``` to class ```Plugin```

## 2025-12-27

- [2.2.0] Add some translations

## 2025-12-27

- [2.2.0] Add config object ```this.config.runtime``` to adjust some runtime settings

## 2025-12-24

- [2.2.0] Pass ```true``` to ```this.app.exit()``` to exit abruptly. Defaults to ```SIGINT```
- [2.2.0] Add ```detailsMessage``` to ```Err``` class if error object has ```details``` in payload
- [2.2.0] Upgrade ```aneka@0.10.0```
- [2.2.0] Bugfix: program arguments should not parsed as object

## 2025-12-21

- [2.2.0] ```runHook()``` now accept both ```alias``` & ```ns``` prefixed name
- [2.2.0] In case of unknown plugin or plugin isn't loaded, ```runHook``` simply exit silently
- [2.2.0] ```this.app.pluginClass``` is now ```this.app.baseClass``` and all containing class definition keys are pascal cased to match with their constructor names

## 2025-12-20

- [2.2.0] Removing dynamically attached methods because its problematic and leads to confusion

## 2025-12-19

- [2.2.0] Upgrade to ```aneka@0.9.0```

## 2025-12-13

- [2.2.0] Add ```app.lib.formatText()```
- [2.2.0] Move most bajo methods that doesn't relate to Bajo to app.lib functions

## 2025-12-11

- [2.1.1] Upgrade to ```aneka@0.5.0```

## 2025-12-09

- [2.1.1] Upgrade to ```aneka@0.2.3```
- [2.1.1] Some organizatory file location changes
- [2.1.1] Typo on class ```Tools```

## 2025-12-05

- [2.1.1] Upgrade to ```aneka@0.2.1```
- [2.1.1] New class ```Tools```, serves as anchestor for ```Err``` & ```Print```

## 2025-12-03

- [2.1.1] Add method ```getPkgInfo()``` to plugins main class.
- [2.1.1] Now you can put your plugins either in ```{dataDir}/config/.plugins``` or directly as an array in your app ```package.json``` under the ```bajo.plugins``` tree. The later takes precedence.
