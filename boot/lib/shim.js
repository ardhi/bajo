export default function () {
  if(!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(subStr, newSubStr){
      return (Object.prototype.toString.call(subStr).toLowerCase() === '[object regexp]') ?
        this.replace(subStr, newSubStr) :
        this.replace(new RegExp(subStr, 'g'), newSubStr);
    }
  }
}
