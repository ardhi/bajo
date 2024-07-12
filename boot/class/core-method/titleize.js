import { words, upperFirst, map, concat, uniq } from 'lodash-es'

const defIgnores = ['or', 'and', 'of', 'with']

const titleize = (text, { ignores = [] } = {}) => {
  return map(words(text), t => {
    ignores = uniq(concat(ignores, defIgnores))
    if (ignores.includes(t)) return t
    return upperFirst(t)
  }).join(' ')
}

export default titleize
