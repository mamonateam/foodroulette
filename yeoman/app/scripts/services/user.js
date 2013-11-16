angular.module('foodroulette')
.factory('FRUser', ['$http', function ($http) {
  var md5,
      me;

  return {
    md5: md5,
    // if id is null returns 'me'
    getUser: function(id) {},
    // registers token
    sendToken: function(token) {},
    // posts me
    postUser: function() {}
  };
}])
