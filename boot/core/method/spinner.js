import { Print } from '../../lib/print.js'

function spinner (options) {
  const print = new Print(options)
  print.setPlugin(this)
  return print
}

export default spinner
