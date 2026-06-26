/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'

import App from '../class/app.js'
import Bajo from '../class/bajo.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-core-test-'))

describe('Bajo', () => {
  let root
  let app
  let bajo

  beforeEach(() => {
    root = createTempRoot()
    app = new App({ cwd: root })
    bajo = new Bajo(app)
    app.bajo = bajo
    app.main = { dir: { pkg: root } }
    app.mainNs = 'main'
    app.main = { pkgName: 'main', dir: { pkg: root } }
    app.demo = {
      dir: { pkg: path.join(root, 'demo') },
      greet: (name) => `hi ${name}`
    }
    bajo.config = {
      env: 'dev',
      lang: 'en-US',
      intl: {
        unitSys: { 'en-US': 'metric' },
        format: {
          emptyValue: '-',
          datetime: { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
          date: { dateStyle: 'medium', timeZone: 'UTC' },
          time: { timeStyle: 'short', timeZone: 'UTC' },
          float: { maximumFractionDigits: 2 },
          double: { maximumFractionDigits: 2 },
          integer: {},
          smallint: {}
        }
      },
      log: {
        level: 'trace'
      }
    }
    bajo.t = (text) => text
  })

  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true })
  })

  it('builds and breaks namespace paths', () => {
    const built = bajo.buildNsPath({ ns: 'demo', subNs: 'api', subSubNs: 'v1', path: '/users' })
    const broken = bajo.breakNsPath('demo.api:/users/:id|42?q=x')

    expect(built).to.equal('demo.api.v1:/users')
    expect(broken).to.include({ ns: 'demo', subNs: 'api', path: '/users/:id', realPath: '/users/42' })
    expect(broken.qs).to.deep.equal({ q: 'x' })
  })

  it('breaks ns path details from filename', () => {
    const info = bajo.breakNsPathFromFile({
      file: 'x/extend/route/demo.api@user-list.js',
      dir: 'x/extend/',
      suffix: '',
      ns: 'demo',
      getType: true
    })

    expect(info).to.include({ ns: 'demo', subNs: 'api', path: 'userList', type: 'route' })
  })

  it('returns unit format and formats values', () => {
    const unit = bajo.getUnitFormat({ lang: 'en-US' })
    const joined = bajo.format(['a', 'b'], 'array')
    const integer = bajo.format(12345, 'integer')

    expect(unit.unitSys).to.equal('metric')
    expect(unit.format).to.be.an('object')
    expect(joined).to.equal('a, b')
    expect(integer).to.be.a('string')
  })

  it('gets method by ns path and supports non-throw mode', () => {
    const fn = bajo.getMethod('demo:greet')
    const miss = bajo.getMethod('demo:notFound', false)

    expect(fn('a')).to.equal('hi a')
    expect(miss).to.equal(undefined)
  })

  it('validates app/plugin package and utility helpers', async () => {
    const appPkg = path.join(root, 'appdir')
    const pluginPkg = path.join(root, 'plugindir')
    await fs.ensureDir(appPkg)
    await fs.ensureDir(pluginPkg)
    await fs.ensureDir(path.join(root, 'empty'))
    await fs.writeJson(path.join(appPkg, 'package.json'), { bajo: { type: 'app' } })
    await fs.writeJson(path.join(pluginPkg, 'package.json'), { bajo: { type: 'plugin' } })

    expect(bajo.isValidApp(appPkg)).to.equal(true)
    expect(bajo.isValidPlugin(pluginPkg)).to.equal(true)
    expect(bajo.join(['a', 'b', 'c'])).to.equal('a, b and c')
    expect(bajo.numUnit('10mb', 'kb')).to.equal('10mb')
    expect(await bajo.isEmptyDir(path.join(root, 'empty'))).to.equal(true)
  })

  it('reads/writes json helpers', async () => {
    const file = path.join(root, 'x.json')
    const content = bajo.toJson({ a: 1 })
    await fs.writeFile(file, content, 'utf8')

    expect(bajo.fromJson(content)).to.deep.equal({ a: 1 })
    expect(bajo.readJson(file)).to.deep.equal({ a: 1 })

    const out = path.join(root, 'out.json')
    bajo.toJson({ b: 2 }, { writeToFile: true, saveAsFile: out })
    expect(fs.existsSync(out)).to.equal(true)
  })
})
