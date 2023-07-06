const expect = require('chai').expect
const pathResolve = require('../helper/path-resolve')

describe('helper.pathResolve()', function () {
  context('without argument', function () {
    it('should throw error', function () {
      expect(() => pathResolve()).to.throw(TypeError)
    })
  })

  context('argument is a file', function () {
    it('should resolve its absolute file with linux syntax', function () {
      const file = 'test/helper-pathResolve.js'
      const result = process.cwd().replace(/\\/g, '/') + '/' + file
      expect(pathResolve(file)).to.equal(result)
    })
  })

  context("argument is a file and useSlah is 'false'", function () {
    it('should resolve its absolute file with current os syntax', function () {
      const file = 'test\\helper-pathResolve.js'
      const result = process.cwd() + '\\' + file
      expect(pathResolve(file, false)).to.equal(result)
    })
  })


})
