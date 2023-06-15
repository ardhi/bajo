const expect = require('chai').expect
const crypto = require('crypto')
const getRandomNumber = require('./_lib/getRandomNumber')
const isSet = require('../helper/is-set').handler

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
      const num = getRandomNumber(0, 9999)
      expect(isSet(num)).to.equal(true)
    })
  })
  context('with any string as argument', function () {
    it("should return 'true'", function () {
      const text = crypto.randomBytes(20).toString('hex')
      expect(isSet(text)).to.equal(true)
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
