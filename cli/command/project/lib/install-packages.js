import { installDependencies } from 'nypm'
import ora from 'ora'

async function installPackages () {
  const spinner = ora('Install dependencies').start()
  try {
    await installDependencies({ cwd: process.cwd(), silent: true })
    spinner.succeed()
  } catch (err) {
    spinner.fail()
    throw err
  }
}

export default installPackages