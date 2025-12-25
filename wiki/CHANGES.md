# Changes

## 2025-12-24

- Pass ```true``` to ```this.app.exit()``` to exit abruptly. Defaults to ```SIGINT```
- Add ```detailsMessage``` to ```Err``` class if error object has ```details``` in payload
- Upgrade ```aneka@0.10.0```
- Bugfix: program arguments should not parsed as object

## 2025-12-21

- ```runHook()``` now accept both ```alias``` & ```ns``` prefixed name
- In case of unknown plugin or plugin isn't loaded, ```runHook``` simply exit silently
- ```this.app.pluginClass``` is now ```this.app.baseClass``` and all containing class definition keys are pascal cased to match with their constructor names

## 2025-12-20

- Removing dynamically attached methods because its problematic and leads to confusion

## 2025-12-19

- Upgrade to ```aneka@0.9.0```

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
