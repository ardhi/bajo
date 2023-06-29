import isValidPlugin from '../../helper/is-valid-plugin.js'
import readJson from '../../helper/read-json.js'
import fastGlob from 'fast-glob'
import _ from 'lodash'
import getGlobalModuleDir from '../../helper/get-global-module-dir.js'

const list = {
  command: 'list',
  aliases: ['l'],
  describe: 'List all available plugins',
  async handler (argv) {
    const nodeModules = getGlobalModuleDir.handler(null, false)
    const pattern = `${nodeModules}/**/*/bajo`
    let files = await fastGlob(pattern, { onlyDirectories: true })
    files = _.map(_.filter(files, f => {
      f = _.dropRight(f.split('/'), 1).join('/')
      return isValidPlugin.handler(f)
    }), f => _.dropRight(f.split('/'), 1).join('/'))
    if (files.length === 0) return console.log(`No bajo plugin found in '${nodeModules}'`)
    for (const f of files) {
      const pkg = readJson.handler(`${f}/package.json`)
      console.log(`${pkg.name} (${pkg.version})${!_.isEmpty(pkg.description) ? ` - ${pkg.description}` : ''}`)
    }
  }
}

export default list
