import isValidApp from '../../helper/is-valid-app.js'
import readJson from '../../helper/read-json.js'
import getGlobalModuleDir from '../../helper/get-global-module-dir.js'
import fastGlob from 'fast-glob'
import _ from 'lodash'

const list = {
  command: 'list',
  aliases: ['l'],
  describe: 'List all installed applications.',
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
