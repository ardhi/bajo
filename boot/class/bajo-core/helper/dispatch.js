import { without } from 'lodash-es'
import _path from 'path'

async function runApplet () {
  const { importPkg, importModule } = this
  const { isString, map, find } = this.lib._
  this.log.debug('Applet mode activated')
  this.print.info('App is running as applet...')
  if (this.applets.length === 0) this.print.fatal('No applets loaded. Aborted!')
  let name = this.applet
  let toc = false
  if (!isString(this.applet)) {
    const select = await importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: this.print.write('Please select:'),
      choices: map(this.applets, t => ({ value: t.ns }))
    })
    toc = true
  }
  const [ns, path, ...params] = name.split(':')
  const applet = find(this.applets, t => (t.ns === ns || t.alias === ns))
  if (!applet) this.print.fatal('Applet \'%s\' not found. Aborted!', name)
  const args = this.app.args
  const opts = { ns: applet.ns, alias: applet.alias, toc, path, params, args }
  const mod = await importModule(applet.file)
  if (mod === 'default' && this.app.bajoCli) {
    const { runApplet } = this.app.bajoCli
    const dir = `${_path.dirname(applet.file)}/applet`
    await runApplet({ path, args, dir, ns: applet.ns, alias: applet.alias })
  } else {
    const handler = mod.handler ?? mod
    await handler.call(this.app[applet.ns], opts)
  }
}

async function dispatch () {
  await this.eachPlugins(async function ({ file, ns, alias }) {
    this.app.bajo.applets.push({ ns, file, alias })
  }, { glob: 'applet.js', baseNs: 'bajoCli' })

  if (this.applet) await runApplet.call(this)
  if (this.app.args.length === 0) return
  const [nsPath, ...args] = this.app.args
  const [ns, path] = nsPath.split(':')
  let plugin
  try {
    plugin = this.getPlugin(ns)
  } catch (err) {}
  if (!plugin || plugin.name === this.name) return
  const mod = await this.importModule(`${plugin.name}:/bajo/run.js`)
  if (!mod) return
  this.app[ns].log.debug('Running plugin specific app...')
  if (path) args.unshift(path)
  await mod.call(plugin, ...args)
}

export default dispatch
