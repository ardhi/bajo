/**
 * Function to attach some of the methods needed but probably not provided by your node installation:
 *
 * - ```String.prototype.replaceAll```
 * - ```String.prototype.splice```
 *
 * @memberof module:Lib
 */
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
  if (!String.prototype.splice) {
    String.prototype.splice = function(index, count, add) { // eslint-disable-line
      if (index < 0) {
        index += this.length
        if (index < 0) index = 0
      }
      return this.slice(0, index) + (add || '') + this.slice(index + count)
    }
  }
}

export default shim
