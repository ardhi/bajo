import buildPackageJson from '../lib/build-package-json.js'

async function interactive({ argv, cwd, isNewDir }) {
  const pkg = await buildPackageJson({ argv, cwd, isNewDir })
}

export default interactive
