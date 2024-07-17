async function runAsApplet () {
  const { isString, map, find } = this.lib._
  await this.eachPlugins(async function ({ file, ns, alias }) {
    this.app.bajo.applets.push({ ns, file, alias })
  }, { glob: 'applet.js', baseNs: 'bajoCli' })

  this.log.debug('Applet mode activated')
  this.print.info('App is running as applet...')
  if (this.applets.length === 0) this.print.fatal('No applets loaded. Aborted!')
  let name = this.applet
  if (!isString(this.applet)) {
    const select = await this.importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: this.print.write('Please select:'),
      choices: map(this.applets, t => ({ value: t.ns }))
    })
  }
  const [ns, path] = name.split(':')
  const applet = find(this.applets, a => (a.ns === ns || a.alias === ns))
  if (!applet) this.print.fatal('Applet \'%s\' not found. Aborted!', name)
  await this.runHook(`${this.app[applet.ns]}:beforeAppletRun`)
  await this.app.bajoCli.runApplet(applet, path, ...this.app.args)
  await this.runHook(`${this.app[applet.ns]}:afterAppletRun`)
}

export default runAsApplet
