import getPluginName from './get-plugin-name.js'

function fatal (...args) {
  const { error } = this.bajo.helper
  const ns = getPluginName.call(this, 3)
  args.push({ ns })
  const [msg, ...params] = args
  const err = error(msg, ...params)
  console.error(err)
  process.exit(1)
}

export default fatal
