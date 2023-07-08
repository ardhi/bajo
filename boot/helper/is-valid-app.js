import fs from 'fs-extra'
import pathResolve from './path-resolve.js'

const isValidApp = (dir) => {
  if (!dir) dir = process.env.BAJOCWD
  dir = pathResolve(dir)
  const hasAppDir = fs.existsSync(`${dir}/app/bajo`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasAppDir && hasPackageJson
}

export default isValidApp
