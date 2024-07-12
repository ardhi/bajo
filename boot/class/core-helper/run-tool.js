import { isString, map, find } from 'lodash-es'
import _path from 'path'

async function runTool () {
  const { eachPlugins, importPkg, importModule, print, log } = this.bajo
  this.bajo.tools = []
  await eachPlugins(async function checkCli ({ file, ns, alias }) {
    this.app.bajo.tools.push({ ns, file, alias })
  }, { glob: 'tool.js', baseNs: 'bajoCli' })
  if (!this.bajo.toolMode) return
  log.debug('Tool mode activated')
  print.info('App is running in tool mode...')
  if (this.bajo.tools.length === 0) print.fatal('No tool loaded. Aborted!')
  let name = this.bajo.toolMode
  let toc = false
  if (!isString(this.bajo.toolMode)) {
    const select = await importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: print.write('Please select:'),
      choices: map(this.bajo.tools, t => ({ value: t.ns }))
    })
    toc = true
  }
  const [ns, path, ...params] = name.split(':')
  const tool = find(this.bajo.tools, t => (t.ns === ns || t.alias === ns))
  if (!tool) print.fatal('Tool \'%s\' not found. Aborted!', name)
  const args = this.bajo.config.args
  const opts = { ns, toc, path, params, args }
  const mod = await importModule(tool.file)
  if (mod === 'default' && this.bajoCli) {
    const { runToolMethod } = this.bajoCli
    const dir = `${_path.dirname(tool.file)}/tool`
    await runToolMethod({ path, args, dir, ns })
  } else {
    const handler = mod.handler ?? mod
    await handler.call(this[tool.ns], opts)
  }
}

export default runTool
