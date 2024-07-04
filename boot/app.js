import util from 'util'
import { last } from 'lodash-es'

class App {
  constructor () {
    this.runAt = new Date()
  }

  addPlugin (plugin) {
    if (this[plugin.name]) throw new Error(`Plugin '${plugin.name}' added already`)
    this[plugin.name] = plugin
  }

  dump (...args) {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, false, null, true)
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }
}

export default App
