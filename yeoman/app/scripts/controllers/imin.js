'use strict';

angular.module('foodroulette')
	.controller('ImInCtrl', ['$scope', '$http', '$location', 'FRUser', 'localStorageService', 'PATHS', 'CONFIG',
		function($scope, $http, $location, FRUser, localStorageService, PATHS, CONFIG) {
			// Are we logged in? if not we move to login screen
      FRUser.get().then(function(data) {
        $scope.me = data;
      });

      // $scope.me.food_roulette.is_eating will hold if user is in
      $scope.is_eating = function(bool) {
        $scope.me.food_roulette.is_eating = bool;
        FRUser.update();
      }

			$scope.logout = function() {
				localStorageService.clearAll();
				$location.path(PATHS.LOGIN);
			};
		}
	]);
