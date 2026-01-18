import aneka from 'aneka/index.js'
import outmatch from 'outmatch'
import lodash from 'lodash'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import freeze from '../../lib/freeze.js'
import findDeep from '../../lib/find-deep.js'
import omitDeep from 'omit-deep'

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(weekOfYear)

/**
 * @typedef {Object} TAppLib
 * @property {Object} _ - Access to {@link https://lodash.com|lodash}
 * @property {Object} fs - Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}
 * @property {Object} fastGlob - Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}
 * @property {Object} sprintf - Access to {@link https://github.com/alexei/sprintf.js|sprintf}
 * @property {Object} aneka - Access to {@link https://github.com/ardhi/aneka|aneka}
 * @property {Object} outmatch - Access to {@link https://github.com/axtgr/outmatch|outmatch}
 * @property {Object} dayjs - Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied
 * @property {Object} freeze
 * @property {Object} findDeep
 * @see App
 */
export const lib = {
  _: lodash,
  fs,
  fastGlob,
  sprintf,
  outmatch,
  dayjs,
  aneka,
  freeze,
  findDeep,
  omitDeep
}

export function outmatchNs (source, pattern) {
  const { breakNsPath } = this.bajo
  const [src, subSrc] = source.split(':')
  if (!subSrc) return pattern === src
  try {
    const { fullNs, path } = breakNsPath(pattern)
    const isMatch = outmatch(path)
    return src === fullNs && isMatch(subSrc)
  } catch (err) {
    return false
  }
}

export function parseObject (obj, options = {}) {
  const me = this
  const { ns = 'bajo', lang } = options
  options.translator = {
    lang,
    prefix: 't:',
    handler: val => {
      const [text, ...args] = val.split('|')
      args.push({ lang })
      return me[ns].t(text, ...args)
    }
  }
  return aneka.parseObject(obj, options)
}
