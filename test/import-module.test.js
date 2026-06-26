/* global describe, it, beforeEach, afterEach */

import os from 'node:os'
import path from 'node:path'
import { expect } from 'chai'
import fs from 'fs-extra'

import importModule from '../lib/import-module.js'

const createTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bajo-import-module-test-'))

const writeModule = async (filePath, content) => {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf8')
}

describe('importModule', () => {
  let rootDir

  beforeEach(() => {
    rootDir = createTempRoot()
  })

  afterEach(() => {
    delete globalThis.__importModuleCounter
    if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true })
  })

  it('imports default export by default', async () => {
    const file = path.join(rootDir, 'default.js')
    await writeModule(file, 'export default "hello"')

    const mod = await importModule(file)

    expect(mod).to.equal('hello')
  })

  it('returns module namespace when asDefaultImport is false', async () => {
    const file = path.join(rootDir, 'named.js')
    await writeModule(file, 'export const answer = 42; export default "x"')

    const mod = await importModule(file, { asDefaultImport: false })

    expect(mod).to.have.property('default', 'x')
    expect(mod).to.have.property('answer', 42)
  })

  it('returns undefined when target file does not exist', async () => {
    const mod = await importModule(path.join(rootDir, 'missing.js'))

    expect(mod).to.equal(undefined)
  })

  it('imports a fresh copy when noCache is true', async () => {
    const file = path.join(rootDir, 'counter.js')
    await writeModule(file, 'globalThis.__importModuleCounter = (globalThis.__importModuleCounter ?? 0) + 1; export default globalThis.__importModuleCounter')

    const first = await importModule(file, { noCache: true })
    const second = await importModule(file, { noCache: true })

    expect(first).to.equal(1)
    expect(second).to.equal(2)
  })

  it('resolves plugin file through context when called with this', async () => {
    const file = path.join(rootDir, 'ctx.js')
    await writeModule(file, 'export default "from-context"')
    const ctx = {
      app: {
        getPluginFile: (input) => {
          expect(input).to.equal('plugin:file')
          return file
        }
      }
    }

    const mod = await importModule.call(ctx, 'plugin:file')

    expect(mod).to.equal('from-context')
  })

  it('wraps function modules into handler object when asHandler is true', async () => {
    const file = path.join(rootDir, 'handler-fn.js')
    await writeModule(file, 'export default function sampleHandler () { return "ok" }')

    const mod = await importModule(file, { asHandler: true })

    expect(mod).to.have.property('level', 999)
    expect(mod).to.have.property('handler').that.is.a('function')
    expect(mod.handler()).to.equal('ok')
  })

  it('returns plain object modules as-is in handler mode', async () => {
    const file = path.join(rootDir, 'handler-obj.js')
    await writeModule(file, 'export default { level: 100, handler: () => "ok" }')

    const mod = await importModule(file, { asHandler: true })

    expect(mod).to.have.property('level', 100)
    expect(mod).to.have.property('handler').that.is.a('function')
  })

  it('throws a generic error for non-handler modules without context', async () => {
    const file = path.join(rootDir, 'bad-handler.js')
    await writeModule(file, 'export default 123')

    let err
    try {
      await importModule(file, { asHandler: true })
    } catch (error) {
      err = error
    }

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.equal(`File '${file}' is NOT a handler module`)
  })

  it('throws contextual error for non-handler modules with context', async () => {
    const file = path.join(rootDir, 'bad-handler-ctx.js')
    await writeModule(file, 'export default 123')
    const ctx = {
      app: {
        getPluginFile: () => file
      },
      error: (code, target) => new Error(`${code}:${target}`)
    }

    let err
    try {
      await importModule.call(ctx, 'any:file', { asHandler: true })
    } catch (error) {
      err = error
    }

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.equal(`fileNotModuleHandler%s:${file}`)
  })
})
