import _ from 'lodash'
const tools = []

async function runTool () {
  const { getConfig, log, eachPlugins, importPkg, importModule, print } = this.bajo.helper
  const config = getConfig()
  if (!config.tool) return
  log.debug(`Run tool`)
  print.info('Side tool is running...')

  await eachPlugins(async function checkCli ({ file, name, alias }) {
    tools.push({ ns: name, file, nsAlias: alias })
  }, { glob: 'bajoCli/tool.js' })
  if (tools.length === 0) print.fatal('No tool loaded. Aborted!')
  let name = config.tool
  let toc = false
  if (!_.isString(config.tool)) {
    const select = await importPkg('@inquirer/select::bajo-cli')
    name = await select({
      message: 'Please select tool provider:',
      choices: _.map(tools, t => ({ value: t.ns }))
    })
    toc = true
  }
  const [ns, path, ...params] = name.split(':')
  const tool = _.find(tools, t => (t.ns === ns || t.nsAlias === ns))
  if (!tool) print.fatal(`Sidetool '${name}' not found. Aborted!`)
  const opts = { ns, toc, path, params, args: config.args }
  const mod = await importModule(tool.file)
  const handler = mod.handler || mod
  await handler.call(this, opts)
}

export default runTool
