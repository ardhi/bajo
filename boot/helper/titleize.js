import { words, upperFirst, map, isFunction } from 'lodash-es'

function titleize (text, { transformer, ignores } = {}) {
  return map(words(text), t => {
    if (isFunction(transformer)) return transformer.call(this, t)
    ignores = ignores ?? ['or', 'and', 'of', 'with']
    if (ignores.includes(t)) return t
    return upperFirst(t)
  }).join(' ')
}

export default titleize
