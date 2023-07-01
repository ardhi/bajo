import _ from 'lodash'
import readJson from '../../../../boot/helper/read-json.js'
import ensureDir from '../lib/ensure-dir.js'
import writePackageJson from '../lib/write-package-json.js'
import copyRootFiles from '../lib/copy-root-files.js'
import copySkel from '../lib/copy-skel.js'
import installPackages from '../lib/install-packages.js'
import tplCheck from '../lib/tpl-check.js'
import ora from 'ora'

async function withTpl({ argv, cwd, type }) {
  const tplDir = await tplCheck({ type, argv, type })
  let pkg
  try {
    pkg = await readJson.handler(`${tplDir}/package.json`)
  } catch (err) {
    try {
      pkg = await readJson.handler(`${tplDir}/../../root/package.json`)
    } catch (err) {
    }
  }
  pkg.name = argv.name
  pkg.packageManager = 'npm@9.1.3'
  await ensureDir(cwd)
  await writePackageJson({ argv, cwd, pkg })
  await copyRootFiles({ pkg, cwd, tplDir, files: ['.env', '.gitignore', 'README.md', 'index.js'] })
  await copySkel({ cwd, tplDir })
  await installPackages()
  ora(`Done!`).succeed()
}

export default withTpl
