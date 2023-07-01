import isValidPlugin from '../../../boot/helper/is-valid-plugin.js'
import readJson from '../../../boot/helper/read-json.js'
import fastGlob from 'fast-glob'
import _ from 'lodash'
import getGlobalModuleDir from '../../../boot/helper/get-global-module-dir.js'
import epilog from '../../lib/epilog.js'

const list = {
  command: 'list',
  aliases: ['l'],
  describe: 'List all installed plugins',
  builder (yargs) {
    yargs.epilog(epilog)
  },
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
