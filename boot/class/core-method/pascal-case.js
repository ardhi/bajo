import { camelCase, upperFirst } from 'lodash-es'

const pascalCase = (text) => {
  return upperFirst(camelCase(text))
}

export default pascalCase
