import { forOwn, invert } from 'lodash-es'
import escapeChars from './escape-chars.js'

const mapping = invert(escapeChars)

function unescape (text) {
  forOwn(mapping, (v, k) => {
    text = text.replaceAll(k, v)
  })
  return text
}

export default unescape
