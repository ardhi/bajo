/**
 * File-system backed cache helper with TTL-based invalidation.
 *
 * @class
 */
class Cache {
  /**
   * @param {object} app - Application container.
   */
  constructor (app) {
    this.app = app
  }

  /**
   * Get root cache directory for this plugin.
   *
   * @returns {string} Absolute cache root directory.
   */
  getRootDir = () => {
    return `${this.app.getPluginDataDir('bajo')}/cache`
  }

  /**
   * Prepare cache paths for a namespaced key and TTL.
   *
   * @param {string} name - Cache key in namespaced path format.
   * @param {number|string} [ttlDur=0] - TTL duration (milliseconds or parseable duration).
   * @returns {{dir: string, file: string, cacheDir: string}|undefined} Prepared paths or undefined when not cacheable.
   */
  prep = (name, ttlDur = 0) => {
    const { breakNsPath } = this.app.bajo
    const { aneka, fs } = this.app.lib
    const { ns, subNs, path } = breakNsPath(name)
    ttlDur = aneka.parseDuration(ttlDur)
    if (ttlDur === 0 || !subNs) return
    const cacheDir = `${this.getRootDir()}/${ns}/${subNs}`
    const dir = `${cacheDir}/${ttlDur}`
    fs.ensureDirSync(dir)
    const file = `${dir}/${path}`
    return { dir, file, cacheDir }
  }

  /**
   * Load cached content when available and not expired.
   *
   * @param {string} name - Cache key in namespaced path format.
   * @param {number|string} [ttlDur=0] - TTL duration (milliseconds or parseable duration).
   * @returns {Promise<*>} Cached value, or undefined if missing/expired.
   */
  load = async (name, ttlDur = 0) => {
    const { fs } = this.app.lib
    const { dir, file } = this.prep(name, ttlDur) ?? {}
    if (!file) return
    if (!fs.existsSync(file)) return
    const { mtimeMs } = await fs.stat(dir)
    if (Date.now() - mtimeMs > ttlDur) {
      await fs.remove(dir)
      return
    }
    let content = fs.readFileSync(file, 'utf8')
    try {
      if (['{', '['].includes(content[0]) && ['}', ']'].includes(content[content.length - 1])) content = JSON.parse(content)
    } catch (err) {}
    return content
  }

  /**
   * Save a value into cache for the given key and TTL directory.
   *
   * @param {string} name - Cache key in namespaced path format.
   * @param {*} item - Value to persist.
   * @param {number|string} [ttlDur=0] - TTL duration (milliseconds or parseable duration).
   * @returns {Promise<void>} Resolves when the value is written.
   */
  save = async (name, item, ttlDur = 0) => {
    const { fs } = this.app.lib
    const { cloneDeep, isArray, isPlainObject } = this.app.lib._
    const { dir, file } = this.prep(name, ttlDur) ?? {}
    if (!file || !item) return
    fs.ensureDirSync(dir)
    const fileDir = file.split('/').slice(0, -1).join('/')
    if (fileDir) fs.ensureDirSync(fileDir)
    let content = cloneDeep(item)
    if (isArray(item) || isPlainObject(item)) content = JSON.stringify(content)
    fs.writeFileSync(file, content, 'utf8')
  }

  /**
   * Return cached content, and store the fallback value if cache is empty.
   *
   * @param {string} name - Cache key in namespaced path format.
   * @param {*} item - Fallback value to save when cache miss happens.
   * @param {number|string} [ttlDur=0] - TTL duration (milliseconds or parseable duration).
   * @returns {Promise<*>} Cached content.
   */
  sync = async (name, item, ttlDur = 0) => {
    const content = await this.loadCache(name, ttlDur)
    if (!content) await this.saveCache(name, item, ttlDur)
    return content
  }

  /**
   * Remove a specific cache namespace or all first-level namespaces.
   *
   * @param {string} name - Namespace name or "*" for all.
   * @returns {void}
   */
  _purgeItem = (name) => {
    if (!this.app.bajo) return
    const { fs, fastGlob } = this.app.lib
    try {
      if (name === '*') {
        const dirs = fastGlob.globSync(`${this.getRootDir()}/*`, { onlyDirectories: true })
        for (const dir of dirs) {
          fs.removeSync(dir)
        }
      } else fs.removeSync(`${this.getRootDir()}/${name}`)
    } catch (err) {}
  }

  /**
   * Purge cache by namespace or remove expired TTL directories.
   *
   * @param {string} [name] - Optional namespace to remove directly.
   * @returns {void}
   */
  purge = (name) => {
    if (!this.app.bajo) return
    if (name) return this._purgeItem(name)
    const { fastGlob, fs } = this.app.lib
    const dirs = fastGlob.globSync(`${this.getRootDir()}/*/*/*`, { onlyDirectories: true })
    for (const dir of dirs) {
      try {
        const ttlDur = Number(dir.split('/').pop())
        const { mtimeMs } = fs.statSync(dir)
        if (Date.now() - mtimeMs > ttlDur) fs.removeSync(dir)
      } catch (err) {}
    }
  }

  /**
   * Dispose internal reference.
   */
  dispose = async () => {
    this.app = null
  }
}

export default Cache
