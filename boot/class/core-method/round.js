function round (val, scale = 0) {
  scale = scale <= 0 ? 1 : 10 ** scale
  return Math.round(val * scale) / scale
}

export default round
