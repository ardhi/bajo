function shim () {
  // taken from: https://vanillajstoolkit.com/polyfills/stringreplaceall/
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr) { // eslint-disable-line
      if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
        return this.replace(str, newStr)
      }
      return this.replace(new RegExp(str, 'g'), newStr)
    }
  }
}

export default shim
