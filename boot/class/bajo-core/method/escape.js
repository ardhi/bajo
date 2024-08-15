import { forOwn } from 'lodash-es'
import escapeChars from './escape-chars.js'

function escape (text) {
  forOwn(escapeChars, (v, k) => {
    text = text.replaceAll(k, v)
  })
  return text
}

export default escape
