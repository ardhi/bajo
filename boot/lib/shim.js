// taken from: https://vanillajstoolkit.com/polyfills/stringreplaceall/

function shim () {
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr){
      if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
        return this.replace(str, newStr)
      }
      return this.replace(new RegExp(str, 'g'), newStr)
    }
  }
}

export default shim
