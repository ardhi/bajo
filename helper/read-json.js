import fs from 'fs-extra'

export default {
  handler: async function (file) {
    const resp = fs.readFileSync(file)
    return JSON.parse(resp)
  },
  noScope: true
}
