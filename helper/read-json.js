import fs from 'fs-extra'
import _ from 'lodash'

export default {
  handler: function (file) {
    let resp = fs.readFileSync(file, 'utf8')
    if (_.isEmpty(resp)) resp = '{}'
    return JSON.parse(resp)
  },
  noScope: true
}
