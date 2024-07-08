import { filter, isEmpty, orderBy, pullAt } from 'lodash-es'

async function runHook (hookName, ...args) {
  const [ns, path] = (hookName ?? '').split(':')
  let fns = filter(this.app.bajo.hooks, { ns, path })
  if (isEmpty(fns)) return
  fns = orderBy(fns, ['level'])
  const results = []
  const removed = []
  for (const i in fns) {
    const fn = fns[i]
    const res = await fn.handler.call(this.app[fn.ns], ...args)
    results.push({
      hook: hookName,
      resp: res
    })
    if (path.startsWith('once')) removed.push(i)
    this.log.trace('Hook \'%s -> %s\' executed', fn.src, hookName)
  }
  if (removed.length > 0) pullAt(this.app.bajo.hooks, removed)

  return results
}

export default runHook
