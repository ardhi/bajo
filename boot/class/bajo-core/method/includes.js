function includes (matcher = [], array = []) {
  if (typeof matcher === 'string') matcher = [matcher]
  let found = false
  for (const m of matcher) {
    found = array.includes(m)
    if (found) break
  }
  return found
}

export default includes
