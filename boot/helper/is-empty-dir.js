import emptyDir from 'empty-dir'
import fs from 'fs-extra'

async function isEmptyDir (dir) {
  await fs.exists(dir)
  return await emptyDir(dir)
}

export default {
  handler: isEmptyDir,
  noScope: true
}
