import path from 'path'
import ora from 'ora'
import listTpl from '../tpl/list-tpl.js'

async function tplCheck ({ type, argv }) {
  const dirs = await listTpl(type)
  let tplDir
  for (const d of dirs) {
    if (path.basename(d) === argv.tpl) {
      tplDir = d
      break
    }
  }
  if (!tplDir) {
    ora(`Unknown app template '${argv.tpl}'. Type: 'bajo project tpl ${type}' for valid templates`).fail()
    process.exit()
  }
  return tplDir
}

export default tplCheck
