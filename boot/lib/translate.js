import { get, isPlainObject } from 'lodash-es'
import Sprintf from 'sprintf-js'
const { sprintf } = Sprintf

function translate (text, ...args) {
  let ntext = text
  if (text) {
    const i18n = get(this, 'app.bajoI18N.instance')
    if (i18n) {
      if (isPlainObject(args[0])) ntext = i18n.t(text, args[0])
      else ntext = i18n.t(text, { ns: this.name, postProcess: 'sprintf', sprintf: args })
    } else ntext = sprintf(text, ...args)
  }
  if (ntext === '') ntext = text
  return ntext
}

export default translate
