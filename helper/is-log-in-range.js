import logLevels from './log-levels.js'
import _ from 'lodash'

function isLogInRange (level) {
  const levels = _.keys(logLevels)
  const logLevel = _.indexOf(levels, this.bajo.config.log.level)
  return _.indexOf(levels, level) >= logLevel
}


export default isLogInRange
