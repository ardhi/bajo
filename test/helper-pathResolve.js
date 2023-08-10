const expect = require('chai').expect
const resolvePath = require('../helper/path-resolve')

describe('helper.resolvePath()', function () {
  context('without argument', function () {
    it('should throw error', function () {
      expect(() => resolvePath()).to.throw(TypeError)
    })
  })

  context('argument is a file', function () {
    it('should resolve its absolute file with linux syntax', function () {
      const file = 'test/helper-resolvePath.js'
      const result = process.cwd().replace(/\\/g, '/') + '/' + file
      expect(resolvePath(file)).to.equal(result)
    })
  })

  context("argument is a file and useSlah is 'false'", function () {
    it('should resolve its absolute file with current os syntax', function () {
      const file = 'test\\helper-resolvePath.js'
      const result = process.cwd() + '\\' + file
      expect(resolvePath(file, false)).to.equal(result)
    })
  })


})
