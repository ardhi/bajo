// taken from: https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript

function secToHms (secs) {
  const secNum = parseInt(secs, 10)
  const hours = Math.floor(secNum / 3600)
  const minutes = Math.floor(secNum / 60) % 60
  const seconds = secNum % 60

  return [hours, minutes, seconds]
    .map(v => v < 10 ? '0' + v : v)
    .filter((v, i) => v !== '00' || i > 0)
    .join(':')
}

export default secToHms
