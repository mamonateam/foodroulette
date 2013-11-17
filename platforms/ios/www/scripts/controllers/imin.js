'use strict';

angular.module('foodroulette')
	.controller('ImInCtrl', ['$scope', '$http', '$location', '$timeout', 'FRUser', 'FRRoulette', 'localStorageService', 'PATHS', 'CONFIG',
		function($scope, $http, $location, $timeout, FRUser, FRRoulette, localStorageService, PATHS, CONFIG) {
      var pooler = null;

      var runPool = function() {
        pooler = $timeout(function() {
          FRRoulette.getStatus().success(function(data) {
            if(data.is_ready)
              $location.path('/roulette');
            else
              runPool();
          });
        }, CONFIG.pollTime);
      };

			// Are we logged in? if not we move to login screen
      FRUser.get().then(function(data) {
        $scope.me = data;
        if($scope.me.food_roulette.is_eating)
          runPool();
      });

      // $scope.me.food_roulette.is_eating will hold if user is in
      $scope.is_eating = function(bool) {
        $scope.me.food_roulette.is_eating = bool;
        FRUser.update().success(function() {
          if(bool) runPool();
          else     $timeout.cancel(pooler);
        });
      }

			$scope.logout = function() {
				localStorageService.clearAll();
				$location.path(PATHS.LOGIN);
			};
		}
	]);
