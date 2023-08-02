import util from 'util'

const dump = (...args) => {
  for (const arg of args) {
    const result = util.inspect(arg, false, null, true)
    console.log(result)
  }
}

export default dump
