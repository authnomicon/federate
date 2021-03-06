/* global describe, it, expect */

var $require = require('proxyquire');
var expect = require('chai').expect;
var sinon = require('sinon');
var factory = require('../../../app/oauth2/http/statestore');
var StateStore = require('../../../lib/oauth2/statestore');


describe('oauth2/http/statestore', function() {
  
  it('should export factory function', function() {
    expect(factory).to.be.a('function');
  });
  
  it('should be annotated', function() {
    expect(factory['@singleton']).to.equal(true);
    expect(factory['@implements']).to.equal('http://i.authnomicon.org/federated/oauth2/http/StateStore');
  });
  
  describe('creating with defaults', function() {
    var StateStoreSpy = sinon.spy(StateStore);
    var factory = $require('../../../app/oauth2/http/statestore',
      { '../../../lib/oauth2/statestore': StateStoreSpy });
    
    var store = factory();
    
    it('should construct store', function() {
      expect(StateStoreSpy).to.have.been.calledOnce;
      expect(StateStoreSpy).to.have.been.calledWithNew;
    });
  
    it('should return store', function() {
      expect(store).to.be.an.instanceOf(StateStore);
    });
  }); // creating with defaults
  
  
  describe('StateStore', function() {
    var store = new StateStore();
  
    describe('#store', function() {
      
      describe('storing state', function() {
        var req = new Object();
        req.state = new Object();
        req.state.push = sinon.spy();
        req.state.save = sinon.spy(function(cb) {
          process.nextTick(function() {
            req.state.handle = 'xyz';
            cb();
          })
        });
      
        var handle;
      
        before(function(done) {
          var state = { provider: 'https://server.example.com' };
          var meta = {
            authorizationURL: 'https://server.example.com/authorize',
            tokenURL: 'https://server.example.com/token',
            clientID: 's6BhdRkqt3',
            callbackURL: 'https://client.example.com/cb'
          }
          
          store.store(req, state, meta, function(err, h) {
            if (err) { return done(err); }
            handle = h;
            done();
          });
        });
      
        it('should push state for redirection endpoint', function() {
          expect(req.state.push).to.have.been.calledOnceWith({
            location: 'https://client.example.com/cb',
            provider: 'https://server.example.com'
          });
          expect(req.state.save).to.have.been.calledOnce;
        });
      
        it('should yield state handle', function() {
          expect(handle).to.equal('xyz');
        });
      }); // storing state
      
      describe('failing to store state', function() {
        var req = new Object();
        req.state = new Object();
        req.state.push = sinon.spy();
        req.state.save = sinon.spy(function(cb) {
          process.nextTick(function() {
            cb(new Error('something went wrong'));
          })
        });
      
        var handle, error;
      
        before(function(done) {
          var state = { provider: 'https://server.example.com' };
          var meta = {
            authorizationURL: 'https://server.example.com/authorize',
            tokenURL: 'https://server.example.com/token',
            clientID: 's6BhdRkqt3',
            callbackURL: 'https://client.example.com/cb'
          }
          
          store.store(req, state, meta, function(err, h) {
            error = err;
            handle = h;
            done();
          });
        });
      
        it('should push state for redirection endpoint', function() {
          expect(req.state.push).to.have.been.calledOnceWith({
            location: 'https://client.example.com/cb',
            provider: 'https://server.example.com'
          });
          expect(req.state.save).to.have.been.calledOnce;
        });
      
        it('should not yield state handle', function() {
          expect(handle).to.be.undefined;
        });
        
        it('should yield error', function() {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('something went wrong');
        });
      }); // failing to store state
      
    }); // #store
    
    describe('#verify', function() {
      
      describe('verifying state', function() {
        var req = new Object();
        req.params = {
          hostname: 'server.example.com'
        };
        req.query = {
          code: 'SplxlOBeZQQYbYS6WxSbIA',
          state: 'xyz'
        };
        req.state = {
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com'
        };
        req.state.destroy = sinon.spy(function(cb) {
          process.nextTick(function() {
            cb();
          })
        });
      
        var ok;
      
        before(function(done) {
          store.verify(req, 'xyz', function(err, rv) {
            if (err) { return done(err); }
            ok = rv;
            done();
          });
        });
      
        it('should destroy state', function() {
          expect(req.state.destroy).to.have.been.calledOnce;
        });
      
        it('should verify', function() {
          expect(ok).to.be.true;
        });
      }); // verifying state
      
      describe('failing to verify state due to lack of state', function() {
        var req = new Object();
      
        var ok, info;
      
        before(function(done) {
          store.verify(req, 'xyz', function(err, rv, i) {
            if (err) { return done(err); }
            ok = rv;
            info = i;
            done();
          });
        });
      
        it('should fail', function() {
          expect(ok).to.be.false;
          expect(info).to.deep.equal({
            message: 'Unable to verify authorization request state.'
          });
        });
      }); // failing to verify state due to lack of state
      
      describe('failing to verify state due to mix-up attack', function() {
        var req = new Object();
        req.params = {
          hostname: 'server.example.net'
        };
        req.query = {
          code: 'SplxlOBeZQQYbYS6WxSbIA',
          state: 'xyz'
        };
        req.state = {
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com'
        };
      
        var ok, info;
      
        before(function(done) {
          store.verify(req, 'xyz', function(err, rv, i) {
            if (err) { return done(err); }
            ok = rv;
            info = i;
            done();
          });
        });
      
        it('should fail', function() {
          expect(ok).to.be.false;
          expect(info).to.deep.equal({
            message: 'Authorization response received from incorrect authorization server.'
          });
        });
      }); // failing to verify state due to mix-up attack
      
    }); // #verify
  
  }); // StateStore
  
});
