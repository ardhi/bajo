import logLevels from './log-levels.js'
import { keys, indexOf } from 'lodash-es'

function isLogInRange (level) {
  const levels = keys(logLevels)
  const logLevel = indexOf(levels, this.bajo.config.log.level)
  return indexOf(levels, level) >= logLevel
}

export default isLogInRange
