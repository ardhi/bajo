class Cache {
  constructor (app) {
    this.app = app
  }

  getRootDir = () => {
    return `${this.app.getPluginDataDir('bajo')}/cache`
  }

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

  save = async (name, item, ttlDur = 0) => {
    const { fs } = this.app.lib
    const { cloneDeep, isArray, isPlainObject } = this.app.lib._
    const { dir, file } = this.prep(name, ttlDur) ?? {}
    if (!file || !item) return
    fs.ensureDirSync(dir)
    let content = cloneDeep(item)
    if (isArray(item) || isPlainObject(item)) content = JSON.stringify(content)
    fs.writeFileSync(file, content, 'utf8')
  }

  sync = async (name, item, ttlDur = 0) => {
    const content = await this.loadCache(name, ttlDur)
    if (!content) await this.saveCache(name, item, ttlDur)
    return content
  }

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

  dispose = async () => {
    this.app = null
  }
}

export default Cache
