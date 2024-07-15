import fs from 'fs-extra'
import { isEmpty } from 'lodash-es'
import parseObject from './parse-object.js'

function readJson (file, thrownNotFound) {
  if (!fs.existsSync(file) && thrownNotFound) throw this.error('File \'%s\' not found', file)
  let resp = fs.readFileSync(file, 'utf8')
  if (isEmpty(resp)) resp = '{}'
  return parseObject(JSON.parse(resp))
}

export default readJson
