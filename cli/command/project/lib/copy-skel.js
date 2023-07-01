import fastGlob from 'fast-glob'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import delay from 'delay'

async function copySkel ({ cwd, tplDir }) {
  const spinner = ora('Copy project skeleton').start()
  await delay(1000)
  const dirs = await fastGlob(`${tplDir}/*`, { onlyDirectories: true })
  for (const d of dirs) {
    try {
      const base = path.basename(d)
      fs.copySync(d, `${cwd}/${base}`)
    } catch (err) {}
  }
  spinner.succeed()
}

export default copySkel
