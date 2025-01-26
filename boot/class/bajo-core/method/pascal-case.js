import lodash from 'lodash'

const { camelCase, upperFirst } = lodash

const pascalCase = (text) => {
  return upperFirst(camelCase(text))
}

export default pascalCase
