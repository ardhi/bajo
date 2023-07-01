import isValidApp from '../../../boot/helper/is-valid-app.js'
import readJson from '../../../boot/helper/read-json.js'
import getGlobalModuleDir from '../../../boot/helper/get-global-module-dir.js'
import fastGlob from 'fast-glob'
import epilog from '../../lib/epilog.js'
import _ from 'lodash'

const list = {
  command: 'list',
  aliases: ['l'],
  describe: 'List all installed applications',
  builder (yargs) {
    yargs.epilog(epilog)
  },
  async handler (argv) {
    const nodeModules = getGlobalModuleDir.handler(null, false)
    const pattern = `${nodeModules}/**/*/app/bajo`
    let files = await fastGlob(pattern, { onlyDirectories: true })
    files = _.map(_.filter(files, f => {
      f = _.dropRight(f.split('/'), 2).join('/')
      return isValidApp.handler(f)
    }), f => _.dropRight(f.split('/'), 2).join('/'))
    if (files.length === 0) return console.log(`No bajo app found in '${nodeModules}'`)
    for (const f of files) {
      const pkg = readJson.handler(`${f}/package.json`)
      console.log(`${pkg.name} (${pkg.version})${!_.isEmpty(pkg.description) ? ` - ${pkg.description}` : ''}`)
    }
  }
}

export default list
