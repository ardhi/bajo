function extractText (text, start, end) {
  let result = ''
  const open = text.indexOf(start)
  if (open > -1) {
    text = text.slice(open + end.length)
    const close = text.indexOf(end)
    if (close > -1) {
      result = text.slice(0, close)
    }
  }
  return result
}

export default extractText
