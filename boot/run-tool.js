import { isString, map, find } from 'lodash-es'
import Path from 'path'
const tools = []

async function runTool () {
  const { getConfig, log, eachPlugins, importPkg, importModule, print } = this.bajo.helper
  const config = getConfig()
  await eachPlugins(async function checkCli ({ file, plugin, alias }) {
    tools.push({ ns: plugin, file, nsAlias: alias })
  }, { glob: 'tool.js', ns: 'bajoCli' })
  this.bajo.tools = tools
  if (!config.tool) return
  log.debug('Run tool')
  print.info('Sidetool is running...')
  if (tools.length === 0) print.fatal('No tool found. Aborted!')
  let name = config.tool
  let toc = false
  if (!isString(config.tool)) {
    const select = await importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: print.__('Please select tool provider:'),
      choices: map(tools, t => ({ value: t.ns }))
    })
    toc = true
  }
  const [ns, path, ...params] = name.split(':')
  const tool = find(tools, t => (t.ns === ns || t.nsAlias === ns))
  if (!tool) print.fatal('Sidetool \'%s\' not found. Aborted!', name)
  const opts = { ns, toc, path, params, args: config.args }
  const mod = await importModule(tool.file)
  if (mod === 'defCliHandler' && this.bajoCli) {
    const { runToolMethod } = this.bajoCli.helper
    const dir = `${Path.dirname(tool.file)}/tool`
    await runToolMethod({ path, args: config.args, dir })
  } else {
    const handler = mod.handler ?? mod
    await handler.call(this, opts)
  }
}

export default runTool
