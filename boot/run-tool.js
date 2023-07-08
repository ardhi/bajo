import path from 'path'
import _ from 'lodash'

const tools = []

function find (name) {
  const { print } = this.bajo.helper
  const [ns, path] = name.split(':')
  const tool = _.find(tools, { ns, path })
  if (!tool) print.fatal(`Sidetool '${name}' not found nor loaded. Aborted!`)
  return tool
}

async function run (opts) {
  const { importModule, print } = this.bajo.helper
  const { name } = opts
  const tool = find.call(this, name)
  print.info(`Run '${tool.ns}:${tool.path}'`)
  const mod = await importModule(tool.file)
  const handler = mod.handler || mod
  await handler.call(this, opts)
}

async function runTool () {
  const { getConfig, log, eachPlugins, importPackage, importModule, print } = this.bajo.helper
  const config = getConfig()
  if (!config.run.tool) return
  log.debug(`Run tool`)
  print.info('Side tool is running...')
  async function checkCli ({ file, name, pkg }) {
    const mod = await importModule(file)
    tools.push({ ns: name, path: _.camelCase(path.basename(file, '.js')), file })
  }
  await eachPlugins(checkCli, { glob: 'bajoCli/tool/*.js' })
  if (tools.length === 0) print.fatal('No tool loaded. Aborted!')
  let name = config.run.tool
  let fromList = false
  if (!_.isString(config.run.tool)) {
    const select = await importPackage('@inquirer/select::bajo-cli')
    name = await select({
      message: 'Which one you would like to run?',
      choices: _.map(tools, t => {
        const value = `${t.ns}:${t.path}`
        const desc = t.description ? `${value} - ${t.description}` : value
        return { value, name: desc }
      })
    })
    fromList = true
  }
  const opts = { name, fromList }
  await run.call(this, opts)
}

export default runTool
