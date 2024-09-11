import { isEmpty } from 'lodash-es'

function numUnit (value = '', defUnit = '') {
  const num = value.match(/\d+/g)
  const unit = value.match(/[a-zA-Z]+/g)
  return `${num[0]}${isEmpty(unit) ? defUnit : unit[0]}`
}

export default numUnit
