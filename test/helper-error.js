const expect = require('chai').expect
const error = require('../helper/error').handler

describe('helper.error()', function () {
  context('without argument', function () {
    it("should return an error with message 'Internal server error'", function () {
      expect(error()).to.be.an('error').and.have.own.property('message', 'Internal server error')
    })
  })
  context('with only text argument', function () {
    it("should return an error with message 'Oops, I did it again!'", function () {
      expect(error('Oops, I did it again!')).to.be.an('error').and.have.own.property('message', 'Oops, I did it again!')
    })
  })
  context('with text argument and payload', function () {
    it("should return an error with message 'James Bond' with payload '{ actor: 'Daniel Craig' }'", function () {
      const err = error('James Bond', { actor: 'Daniel Craig' })
      expect(err).to.be.an('error').and.have.own.property('message', 'James Bond')
      expect(err).to.be.an('error').and.have.own.property('actor', 'Daniel Craig')
    })
  })
})
