import fs from 'fs-extra'
import _ from 'lodash'

const readJson = (file) => {
  let resp = fs.readFileSync(file, 'utf8')
  if (_.isEmpty(resp)) resp = '{}'
  return JSON.parse(resp)
}

export default readJson
