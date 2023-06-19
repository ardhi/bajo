import pathResolve from './path-resolve.js'

export default {
  handler: async function (file, asDefaultImport = true) {
    const imported = await import(pathResolve.handler(file, true))
    if (asDefaultImport) return imported.default
    return imported
  },
  noScope: true
}