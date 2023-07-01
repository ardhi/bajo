import fastGlob from 'fast-glob'
import getGlobalModuleDir from '../../../../boot/helper/get-global-module-dir.js'

async function listTpl (type) {
  let dir = getGlobalModuleDir.handler('bajo')
  dir = `${dir}/cli/command/project/tpl/create-${type}`
  return await fastGlob(`${dir}/*`, { onlyDirectories: true })
}

export default listTpl