import rawlist from '@inquirer/rawlist'
import checkbox from '@inquirer/checkbox'
import _ from 'lodash'
import fs from 'fs-extra'
import listTpl from '../tpl/list-tpl.js'
import path from 'path'

const plugins = [
  { value: 'bajo-config' },
  { value: 'bajo-logger' },
  { value: 'bajo-emitter' },
  { value: 'bajo-mqtt' },
  { value: 'bajo-sp' },
  { value: 'bajo-web' }
]

async function customInstall ({ argv, type, session }) {
  const ext = {}
  const dirs = await listTpl(type)
  const choices = []
  for (const d of dirs) {
    const name = path.basename(d)
    let info
    try {
      info = fs.readFileSync(`${d}/info.txt`)
    } catch (err) {}
    choices.push({ value: name, name: `${name} - ${info}` })
  }
  const def = _.findIndex(choices, { value: _.get(session, 'ext.tpl') })
  ext.tpl = await rawlist({
    message: `Choose which ${type} template you want to use:`,
    default: def, // TODO: it doesn't work!
    choices
  })
  if (type === 'app') {
    let choices = [
      { value: 'local', name: 'Local, self contained project' },
      { value: 'global', name: 'Global, rely on bajo executable to start' },
      { value: 'hybrid', name: 'Hybrid, the best of both worlds' }
    ]
    const def = _.findIndex(choices, { value: _.get(session, 'ext.bootFile')})
    ext.bootFile = await rawlist({
      message: 'What kind of app do you want to create?',
      default: def, // TODO: it doesn't work!
      choices
    })
    choices = _.map(_.cloneDeep(plugins), p => {
      p.checked = _.get(session, 'ext.plugins', []).includes(p.value)
      return p
    })
    ext.plugins = await checkbox({
      message: 'Choose which plugins should be included by default:',
      default: _.get(session, 'ext.plugins', []),
      choices
    })

  } else if (type === 'plugin') {
    const choices = _.map(_.cloneDeep(plugins), p => {
      p.checked = _.get(session, 'ext.dependencies', []).includes(p.value)
      return p
    })
    ext.dependencies = await checkbox({
      message: 'Choose other plugins that your plugin dependent of:',
      default: _.get(session, 'ext.dependencies', []),
      choices
    })
  }
  return ext
}

export default customInstall
