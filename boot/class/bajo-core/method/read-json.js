import fs from 'fs-extra'
import lodash from 'lodash'
import parseObject from './parse-object.js'

const { isEmpty } = lodash

function readJson (file, thrownNotFound) {
  if (!fs.existsSync(file) && thrownNotFound) throw this.error('File \'%s\' not found', file)
  let resp = fs.readFileSync(file, 'utf8')
  if (isEmpty(resp)) resp = '{}'
  return parseObject(JSON.parse(resp))
}

export default readJson
