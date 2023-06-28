import fs from 'fs-extra'
import pathResolve from './path-resolve.js'

function isValidApp (dir) {
  if (!dir) dir = process.cwd()
  dir = pathResolve.handler(dir)
  const hasAppDir = fs.existsSync(`${dir}/app/bajo`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasAppDir && hasPackageJson
}

export default {
  handler: isValidApp,
  noScope: true
}
