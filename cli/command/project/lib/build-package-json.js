import { input } from '@inquirer/prompts'
import select, { Separator } from '@inquirer/select'
import semver from 'semver'
import _ from 'lodash'
import ora from 'ora'
import boxen from 'boxen'

async function buildPackageJson ({ argv, cwd, isNewDir }) {
  const pkg = { name: argv.name, type: 'module' }
  pkg.version = await input({
    message: 'Version',
    default: '0.0.1',
    validate (text) {
      return semver.clean(text) ? true : 'Invalid version'
    }
  })
  pkg.description = await input({
    message: 'Description'
  })
  const repo = await input({
    message: 'Git Repository'
  })
  const keywords = await input({
    message: 'Keywords'
  })
  pkg.author = await input({
    message: 'Author'
  })
  pkg.license = await input({
    message: 'License',
    default: 'MIT'
  })
  pkg.repository = {
    type: 'git',
    url: repo
  }
  pkg.keywords = _.without(_.map((keywords || '').replaceAll(',', ' ').split(' '), k => _.trim(k)), '', undefined, null)
  console.log(boxen(JSON.stringify(pkg, null, 2), { title: 'package.json', padding: 1, borderStyle: 'round' }))
  const answer = await select({
    message: 'Continue?',
    choices: [
      { value: 'y', name: 'Yes, continue' },
      { value: 'n', name: 'No, abort' },
      new Separator(),
      { value: 'e', name: 'Back to edit' }
    ]
  })
  switch (answer) {
    case 'e':
      await buildPackageJson({ argv, cwd, isNewDir })
      break
    case 'y':
      return pkg
    case 'n':
      ora('Aborted').fail()
      process.exit()
  }
}

export default buildPackageJson