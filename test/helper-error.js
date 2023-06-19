const expect = require('chai').expect
const error = require('../helper/error').handler
const { faker } = require('@faker-js/faker')

describe('helper.error()', function () {
  context('without argument', function () {
    it("should return an error with message 'Internal server error'", function () {
      expect(error()).to.be.an('error').and.have.own.property('message', 'Internal server error')
    })
  })
  context('with only text argument', function () {
    const text = faker.string.alphanumeric({ length: { min: 5, max: 20 } })
    it(`should return an error with message '${text}'`, function () {
      expect(error(text)).to.be.an('error').and.have.own.property('message', text)
    })
  })
  context('with text argument and payload', function () {
    const object = faker.science.chemicalElement()
    it(`should return an error with message '${object.name}' and payload '${JSON.stringify(object)}'`, function () {
      const err = error(object.name, object)
      expect(err).to.be.an('error').and.have.own.property('message', object.name)
      expect(err).to.be.an('error').and.to.include(object)
    })
  })
})
