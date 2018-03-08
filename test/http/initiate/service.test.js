/* global describe, it, expect */

var expect = require('chai').expect;
var sinon = require('sinon');
var factory = require('../../../app/http/initiate/service');


describe('http/initiate/service', function() {
  
  it('should export factory function', function() {
    expect(factory).to.be.a('function');
  });
  
  it('should be annotated', function() {
    expect(factory['@implements']).to.deep.equal([
      'http://i.bixbyjs.org/http/Service',
      'http://schemas.authnomicon.org/js/http/federation/InitiationService'
    ]);
    expect(factory['@path']).to.equal('/federate');
    expect(factory['@singleton']).to.be.undefined;
  });
  
});
