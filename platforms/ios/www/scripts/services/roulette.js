angular.module('foodroulette')
.factory('FRRoulette', ['$http', 'CONFIG', function ($http, CONFIG) {

  return {
    getStatus: function() {
      return $http.get(CONFIG.backend + "/roulette");
    }
  };
}]);
