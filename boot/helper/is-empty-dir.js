import emptyDir from 'empty-dir'
import fs from 'fs-extra'

const isEmptyDir = async (dir) => {
  await fs.exists(dir)
  return await emptyDir(dir)
}

export default isEmptyDir
