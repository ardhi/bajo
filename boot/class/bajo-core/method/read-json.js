import fs from 'fs-extra'
import lodash from 'lodash'
import parseObject from './parse-object.js'

const { isEmpty } = lodash

function readJson (file, thrownNotFound) {
  if (!fs.existsSync(file) && thrownNotFound) throw this.error('notFound%s%s', this.print.write('file'), file)
  let resp = fs.readFileSync(file, 'utf8')
  if (isEmpty(resp)) resp = '{}'
  return parseObject(JSON.parse(resp))
}

export default readJson
