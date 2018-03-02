// TODO: Can remove this file
exports = module.exports = function(issuer, Token) {
  Token = Token || require('oauth2-token');
  
  
  return function verify(accessToken, refreshToken, params, profile, cb) {
    if (profile && profile.provider) {
      delete profile.provider;
    }
    
    var info = { issuer: issuer };
    info.protocol = 'oauth2';
    info.credentials = [ Token.parse(params) ];
    
    cb(null, profile, info);
  };
};
