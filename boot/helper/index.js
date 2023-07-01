/**
 * Bajo Helper is a general-purpose container that consists of functions, objects, or arrays
 * that are accessible across all plugins/Bajos and applications. It also serves as a proxy
 * to some exported third-party libraries.
 *
 * To use it, simply deconstruct the variables you want from Bajo Helper as shown in the
 * example below.
 *
 * @module helper
 * @example
 * module.exports = async function () {
 *  const { fs, getConfig } = this.bajo.helper
 *  const config = getConfig('bajoExtra')
 *  await fs.writeFile('./bajo-extra-config.json', JSON.stringify(config), 'utf8')
 * }
 */

/**
 * | Attached As | Package Name | Usage |
 * |-------------|--------------|-------|
 * | _ | [lodash](https://lodash.com/) | ```const { _ } = this.bajo.helper``` |
 * | callsites | [callsites](https://github.com/sindresorhus/callsites) | ```const { _ } = this.bajo.helper``` |
 * | dateFormat | [dateformat](https://github.com/felixge/node-dateformat) | ```const { dateFormat } = this.bajo.helper``` |
 * | fastGlob | [fast-glob](https://github.com/mrmlnc/fast-glob) | ```const { fastGlob } = this.bajo.helper``` |
 * | flatten | [flat](https://github.com/hughsk/flat) | ```const { flatten } = this.bajo.helper``` |
 * | freeze | [deep-freeze-strict](https://github.com/jsdf/deep-freeze) | ```const { freeze } = this.bajo.helper``` |
 * | fs | [fs-extra](https://github.com/jprichardson/node-fs-extra) | ```const { fs } = this.bajo.helper``` |
 * | lockfile | [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile) | ```const { lockfile } = this.bajo.helper``` |
 * | outmatch | [outmatch](https://github.com/axtgr/outmatch) | ```const { outmatch } = this.bajo.helper``` |
 * | semver | [semver](https://github.com/npm/node-semver) | ```const { semver } = this.bajo.helper``` |
 * | unflatten | [flat](https://github.com/hughsk/flat) | ```const { unflatten } = this.bajo.helper``` |
 *
 * @memberof module:helper/3rdPartyLibs
 * @name 3rd Party Libraries
 * @instance
 */
