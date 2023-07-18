import error from './error.js'

function fatal (...args) {
  const err = error(...args)
  console.error(err)
  process.exit(1)
}

export default fatal
