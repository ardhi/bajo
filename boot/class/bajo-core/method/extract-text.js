function extractText (text, patternStart, patternEnd) {
  let result = ''
  const open = text.indexOf(patternStart)
  if (open > -1) {
    text = text.slice(open + patternStart.length)
    const close = text.indexOf(patternEnd)
    if (close > -1) {
      result = text.slice(0, close)
    }
  }
  const pattern = `${patternStart}${result}${patternEnd}`
  return { result, pattern }
}

export default extractText
