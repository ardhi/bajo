import path from 'path'
import { fileURLToPath } from 'url'

const __ = (meta) => {
  const file = fileURLToPath(meta.url)
  const dir = path.dirname(file)
  return { dir, file, __dirname: dir, __filename: file }
}

export default __
