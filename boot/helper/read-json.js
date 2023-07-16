import fs from 'fs-extra'
import { isEmpty } from 'lodash-es'

const readJson = (file) => {
  let resp = fs.readFileSync(file, 'utf8')
  if (isEmpty(resp)) resp = '{}'
  return JSON.parse(resp)
}

export default readJson
