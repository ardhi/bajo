import error from './error.js'
import getPluginName from './get-plugin-name.js'

function fatal (...args) {
  const ns = getPluginName.call(this, 3)
  args.push({ ns })
  const err = error(...args)
  console.error(err)
  process.exit(1)
}

export default fatal
