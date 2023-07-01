import fs from 'fs-extra'
import ora from 'ora'
import delay from 'delay'

async function ensureDir (cwd) {
  const spinner = ora('Ensure project dir').start()
  await delay(1000)
  fs.ensureDirSync(cwd)
  process.chdir(cwd)
  spinner.succeed()
}

export default ensureDir