import util from 'util'
import { last } from 'lodash-es'

const dump = (...args) => {
  const terminate = last(args) === true
  if (terminate) args.pop()
  for (const arg of args) {
    const result = util.inspect(arg, false, null, true)
    console.log(result)
  }
  if (terminate) process.kill(process.pid, 'SIGINT')
}

export default dump
