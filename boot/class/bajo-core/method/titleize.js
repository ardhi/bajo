import lodash from 'lodash'
import generateId from './generate-id.js'

const { words, upperFirst, map, concat, uniq, forOwn } = lodash
const defIgnores = ['or', 'and', 'of', 'with']

const titleize = (text, { ignores = [], replacement = {} } = {}) => {
  const replacer = {}
  forOwn(replacement, (v, k) => {
    const id = generateId('int')
    replacer[id] = k
    text = text.replace(k, ` ${id} `)
  })
  return map(words(text), t => {
    forOwn(replacer, (v, k) => {
      if (k === t) t = replacement[replacer[k]]
    })
    ignores = uniq(concat(ignores, defIgnores))
    if (ignores.includes(t)) return t
    return upperFirst(t)
  }).join(' ')
}

export default titleize
