module.exports = function (name, ...params) {
  this.bajo.event.emit(name, ...params)
}
