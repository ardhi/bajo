import { trim } from 'lodash-es'
import fs from 'fs-extra'

function resolveTplPath (name, baseTpl, extTpl = '') {
  const { breakNsPath } = this.app.bajo
  const [ns, path] = breakNsPath(name)
  let file = `${this.app[ns].config.dir.pkg}/${baseTpl}/${trim(path, '/')}${extTpl}`
  const override = `${this.app.main.config.dir.pkg}/${baseTpl}/override/${ns}/${trim(path, '/')}${extTpl}`
  if (fs.existsSync(override)) file = override
  return file
}

export default resolveTplPath
