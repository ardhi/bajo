import App from './class/app.js'
import shim from './lib/shim.js'

shim()

async function boot (cwd) {
  const app = new App(cwd)
  await app.boot()
  return app
}

export default boot
