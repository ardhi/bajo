import os from 'os'
import fs from 'fs-extra'
import defaultsDeep from '../method/defaults-deep.js'
import resolvePath from '../method/resolve-path.js'
import currentLoc from '../method/current-loc.js'
import { set, get } from 'lodash-es'

async function buildBaseConfig () {
  this.toolMode = this.app.argv.root.tool
  this.config = defaultsDeep({}, this.app.env.root, this.app.argv.root)
  this.config.name = this.name
  this.config.alias = this.name
  set(this, 'config.dir.base', this.app.cwd)
  const path = currentLoc(import.meta).dir + '/../../../..'
  set(this, 'config.dir.pkg', resolvePath(path))
  if (!get(this, 'config.dir.data')) set(this, 'config.dir.data', `${this.config.dir.base}/data`)
  this.config.dir.data = resolvePath(this.config.dir.data)
  if (!this.config.dir.tmp) {
    this.config.dir.tmp = `${resolvePath(os.tmpdir())}/${this.name}`
    fs.ensureDirSync(this.config.dir.tmp)
  }
  this.app.addPlugin(this)
}

export default buildBaseConfig
