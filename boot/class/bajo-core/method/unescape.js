import { forOwn } from 'lodash-es'

const mapping = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'"
}

function unescape (text) {
  forOwn(mapping, (v, k) => {
    text = text.replaceAll(k, v)
  })
  return text
}

export default unescape
