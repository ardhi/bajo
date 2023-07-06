const expect = require('chai').expect
const { faker } = require('@faker-js/faker')
const isSet = require('../helper/is-set')

describe('helper.isSet()', function () {
  context('without argument', function () {
    it("should return 'false'", function () {
      expect(isSet()).to.equal(false)
    })
  })
  context("with 'null' as argument", function () {
    it("should return 'false'", function () {
      expect(isSet(null)).to.equal(false)
    })
  })
  context("with 'undefined' as argument", function () {
    it("should return 'false'", function () {
      expect(isSet(undefined)).to.equal(false)
    })
  })
  context('with any number as argument', function () {
    it("should return 'true'", function () {
      expect(isSet(faker.number.float())).to.equal(true)
    })
  })
  context('with any string as argument', function () {
    it("should return 'true'", function () {
      expect(isSet(faker.string.alphanumeric())).to.equal(true)
    })
  })
  context('with empty object as argument', function () {
    it("should return 'true'", function () {
      expect(isSet({})).to.equal(true)
    })
  })
  context('with non empty object as argument', function () {
    it("should return 'true'", function () {
      expect(isSet({ a: 1, b: 2 })).to.equal(true)
    })
  })
})
