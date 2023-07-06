import path from 'path'
import _ from 'lodash'

const tools = []

function find (name, ora) {
  const [ns, path] = name.split(':')
  const tool = _.find(tools, { ns, path })
  if (!tool) {
    ora(`Sidetool '${name}' not found nor loaded. Aborted!`).fail()
    process.exit(1)
  }
  return tool
}

async function run (name, ora) {
  const tool = find(name, ora)
  let text = `Run '${tool.ns}:${tool.path}'`
  if (tool.description) text += ` - ${tool.description}`
  ora(text).succeed()
  await tool.handler.call(this)
}

async function runTool () {
  const { getConfig, log, eachPlugins, importPackage, importModule } = this.bajo.helper
  const ora = await importPackage('ora::bajo-cli')
  const config = getConfig()
  if (!config.run.tool) return
  log.debug(`Run tool`)
  async function checkCli ({ file, name, pkg }) {
    let mod = await importModule(file)
    if (_.isFunction(mod)) mod = { handler: mod }
    _.merge(mod, { ns: name, path: _.camelCase(path.basename(file, '.js')) })
    tools.push(mod)
  }
  await eachPlugins(checkCli, { glob: 'bajoCli/tool/*.js' })
  if (tools.length === 0) {
    ora('No tool loaded. Aborted!').fail()
    return
  }
  let answer = config.run.tool
  if (!_.isString(config.run.tool)) {
    const select = await importPackage('@inquirer/select::bajo-cli')
    answer = await select({
      message: 'Which one you would like to run?',
      choices: _.map(tools, t => {
        const value = `${t.ns}:${t.path}`
        const name = t.description ? `${value} - ${t.description}` : value
        return { value, name }
      })
    })
  }
  await run.call(this, answer, ora)
}

export default runTool
