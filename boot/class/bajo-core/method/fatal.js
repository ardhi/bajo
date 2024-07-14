export default function (...args) {
  const { error } = this.app.bajo
  const ns = this.name
  args.push({ ns })
  const [msg, ...params] = args
  const err = error(msg, ...params)
  console.error(err)
  process.kill(process.pid, 'SIGINT')
}
