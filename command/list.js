import isValidApp from '../helper/is-valid-app.js'
import pathResolve from '../helper/path-resolve.js'
import globalModulesPath from 'global-modules-path'
import fastGlob from 'fast-glob'
import readJson from '../helper/read-json.js'
import _ from 'lodash'

const run = {
  command: 'list',
  describe: 'list installed app',
  async handler (argv) {
    const npmPath = globalModulesPath.getPath('npm')
    if (!npmPath) return console.error(`Can't locate npm global module directory`)
    const nodeModules = _.dropRight(pathResolve.handler(npmPath).split('/'), 1).join('/')
    const pattern = `${nodeModules}/**/*/app/bajo`
    let files = await fastGlob(pattern, { onlyDirectories: true })
    files = _.map(_.filter(files, f => {
      f = _.dropRight(f.split('/'), 2).join('/')
      return isValidApp.handler(f)
    }), f => _.dropRight(f.split('/'), 2).join('/'))
    if (files.length === 0) return console.log(`No bajo app found in '${npmPath}'`)
    for (const f of files) {
      const pkg = readJson.handler(`${f}/package.json`)
      console.log(`${pkg.name} (${pkg.version})${!_.isEmpty(pkg.description) ? ` - ${_pkg.description}` : ''}`)
    }
  }
}

export default run
