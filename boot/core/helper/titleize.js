import { words, upperFirst, map, isFunction, concat, uniq } from 'lodash-es'

const defIgnores = ['or', 'and', 'of', 'with']

function titleize (text, { transformer, ignores = [] } = {}) {
  return map(words(text), t => {
    if (isFunction(transformer)) return transformer.call(this, t)
    ignores = uniq(concat(ignores, defIgnores))
    if (ignores.includes(t)) return t
    return upperFirst(t)
  }).join(' ')
}

export default titleize
