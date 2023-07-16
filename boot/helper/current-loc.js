import path from 'path'
import pathResolve from './path-resolve.js'
import { fileURLToPath } from 'url'

const currentLoc = (meta) => {
  const file = pathResolve(fileURLToPath(meta.url))
  const dir = path.dirname(file)
  return { dir, file, __dirname: dir, __filename: file }
}

export default currentLoc
