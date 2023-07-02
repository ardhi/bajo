import listTpl from './tpl/list-tpl.js'
import path from 'path'
import fs from 'fs-extra'
import epilog from '../../lib/epilog.js'

const listTemplate = {
  command: 'list-template <type>',
  aliases: ['lt'],
  describe: `List project templates`,
  builder (yargs) {
    yargs.positional('type', {
      describe: 'Template type',
      choices: ['app', 'plugin'],
      type: 'string'
    })
    yargs.epilog(epilog)
  },
  async handler (argv) {
    const dirs = await listTpl(argv.type)
    for (const d of dirs) {
      const name = path.basename(d)
      let info
      try {
        info = fs.readFileSync(`${d}/info.txt`)
      } catch (err) {}
      console.log(name + (info ? ` - ${info}` : ''))
    }
  }
}

export default listTemplate
