import validate from 'validate-npm-package-name'
import pathResolve from '../../../../boot/helper/path-resolve.js'
import isEmptyDir from '../../../../boot/helper/is-empty-dir.js'
import path from 'path'
import ora from 'ora'
import delay from 'delay'
import fs from 'fs-extra'
import fetch from 'node-fetch'

const npmUrl = 'https://registry.npmjs.com'

async function dirNameCheck (argv, cwd) {
  if (!cwd) cwd = pathResolve.handler(process.cwd())
  if (argv.name === '.\\') argv.name = './'
  if (['.', './'].includes(argv.name)) {
    argv.name = path.basename(cwd)
  } else cwd = `${cwd}/${argv.name}`
  const spinner = ora('Checking name').start()
  await delay(1000)
  const nameCheck = validate(argv.name)
  if (!nameCheck.validForNewPackages) {
    spinner.fail(`Package name '${argv.name}' is not a valid npm package name. Aborted!`)
    process.exit(1)
  }
  if (argv.checkRemote) {
    try {
      const resp = await fetch(`${npmUrl}/${encodeURIComponent(argv.name)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (resp.status !== 404) {
        spinner.fail(`Package name '${argv.name}' is taken on npm registry. Aborted!`)
        process.exit(1)
      }
    } catch (err) {
      spinner.fail(`Can't check '${argv.name}' against npm registry. Aborted!`)
      process.exit(1)
    }
  }
  if (fs.existsSync(cwd) && !(await isEmptyDir.handler(cwd))) {
    spinner.fail(`Dir '${path.resolve(cwd)}' is NOT empty. Aborted!`)
    process.exit(1)
  }
  spinner.succeed(`Package name: ${argv.name}`)
  return cwd
}

export default dirNameCheck
