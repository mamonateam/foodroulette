angular.module('foodroulette')
.factory('FRRoulette', ['$http', 'CONFIG', function ($http, CONFIG) {

  return {
    // GET /roulette
    // returns:
    // - (Array[user_ids]): roulette resolved
    getStatus: function() {
      return $http.get(CONFIG.backend + "/roulette");
    }

  };
}]);
