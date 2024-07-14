import { isString, map, find } from 'lodash-es'
import _path from 'path'

async function runTool () {
  const { eachPlugins, importPkg, importModule } = this
  this.tools = []
  await eachPlugins(async function checkCli ({ file, ns, alias }) {
    this.app.bajo.tools.push({ ns, file, alias })
  }, { glob: 'tool.js', baseNs: 'bajoCli' })
  if (!this.toolMode) return
  this.log.debug('Tool mode activated')
  this.print.info('App is running in tool mode...')
  if (this.tools.length === 0) this.print.fatal('No tool loaded. Aborted!')
  let name = this.toolMode
  let toc = false
  if (!isString(this.toolMode)) {
    const select = await importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: this.print.write('Please select:'),
      choices: map(this.tools, t => ({ value: t.ns }))
    })
    toc = true
  }
  const [ns, path, ...params] = name.split(':')
  const tool = find(this.tools, t => (t.ns === ns || t.alias === ns))
  if (!tool) this.print.fatal('Tool \'%s\' not found. Aborted!', name)
  const args = this.config.args
  const opts = { ns: tool.ns, alias: tool.alias, toc, path, params, args }
  const mod = await importModule(tool.file)
  if (mod === 'default' && this.app.bajoCli) {
    const { runToolMethod } = this.app.bajoCli
    const dir = `${_path.dirname(tool.file)}/tool`
    await runToolMethod({ path, args, dir, ns: tool.ns, alias: tool.alias })
  } else {
    const handler = mod.handler ?? mod
    await handler.call(this.app[tool.ns], opts)
  }
}

export default runTool
