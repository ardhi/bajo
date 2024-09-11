function sliceString (content, start, end) {
  const idx1 = content.indexOf(start)
  if (idx1 === -1) return false
  let idx2 = content.indexOf(end)
  if (idx2 === -1) return false
  if (idx2 < idx1) {
    const tmp = content.slice(idx1)
    idx2 = tmp.indexOf(end) + idx1
  }
  return content.slice(idx1, idx2 + end.length)
}

export default sliceString
