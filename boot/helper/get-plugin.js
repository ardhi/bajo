async function getPlugin (name) {
  const { error } = this.bajo.helper
  if (!this[name]) throw error('\'%s\' is not loaded', name)
  return this[name]
}

export default getPlugin
