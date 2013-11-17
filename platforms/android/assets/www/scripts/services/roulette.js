angular.module('foodroulette')
.factory('FRRoulette', ['$http', function ($http) {

  return {
    // GET /roulette
    // returns:
    // - (bool) false: In register process
    // - (Array[user_ids]): roulette resolved
    getStatus: function() {},
    // I'm in (yes/no)
    imIn: function(bool) {}
  };
}]);
