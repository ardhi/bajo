import path from 'path'
import resolvePath from './resolve-path.js'
import { fileURLToPath } from 'url'

const currentLoc = (meta) => {
  const file = resolvePath(fileURLToPath(meta.url))
  const dir = path.dirname(file)
  return { dir, file, __dirname: dir, __filename: file }
}

export default currentLoc
