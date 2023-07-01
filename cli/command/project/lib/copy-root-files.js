import fs from 'fs-extra'
import ora from 'ora'
import delay from 'delay'

async function copyRootFiles ({ pkg, cwd, tplDir, files }) {
  const spinner = ora('Copy project files').start()
  await delay(1000)
  for (const f of files) {
    try {
      fs.copySync(`${tplDir}/${f}`, `${cwd}/${f}`)
    } catch (err) {
      try {
        fs.copySync(`${tplDir}/../../root/${f}`, `${cwd}/${f}`)
      } catch (err) {}
    }
  }
  try {
    fs.copySync(`${tplDir}/../../license/${pkg.license}`, `${cwd}/LICENSE`)
  } catch (err) {}
  spinner.succeed()
}

export default copyRootFiles
