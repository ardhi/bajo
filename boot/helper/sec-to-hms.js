import { padStart } from 'lodash-es'

// based on: https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript

function secToHms (secs, ms) {
  let remain
  if (ms) {
    remain = secs % 1000
    secs = Math.floor(secs / 1000)
  }
  const secNum = parseInt(secs, 10)
  const hours = Math.floor(secNum / 3600)
  const minutes = Math.floor(secNum / 60) % 60
  const seconds = secNum % 60

  let hms = [hours, minutes, seconds]
    .map(v => v < 10 ? '0' + v : v)
    .filter((v, i) => v !== '00' || i > 0)
    .join(':')
  if (ms) hms += '+' + padStart(remain, 3, '0')
  return hms
}

export default secToHms
