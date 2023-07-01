import fs from 'fs-extra'
import ora from 'ora'
import delay from 'delay'

async function writePackageJson ({ argv, cwd, pkg }) {
  const spinner = ora('Write package.json').start()
  await delay(1000)
  fs.writeJSONSync(`${cwd}/package.json`, pkg, { spaces: 2 })
  spinner.succeed()
}

export default writePackageJson