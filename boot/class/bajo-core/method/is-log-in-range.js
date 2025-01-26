import logLevels from './log-levels.js'
import lodash from 'lodash'

const { keys, indexOf } = lodash

function isLogInRange (level) {
  const levels = keys(logLevels)
  const logLevel = indexOf(levels, this.app.bajo.config.log.level)
  return indexOf(levels, level) >= logLevel
}

export default isLogInRange
