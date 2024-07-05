function fatal (...args) {
  const { error } = this.app.bajo.helper
  const ns = this.name
  args.push({ ns })
  const [msg, ...params] = args
  const err = error(msg, ...params)
  console.error(err)
  process.kill(process.pid, 'SIGINT')
}

export default fatal
