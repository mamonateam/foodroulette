'use strict';

angular.module('foodroulette')
	.controller('ImInCtrl', ['$scope', '$http', '$location', 'FRUser', 'localStorageService', 'PATHS', 'CONFIG',
		function($scope, $http, $location, FRUser, localStorageService, PATHS, CONFIG) {
			// Are we logged in? if not we move to login screen
			$scope.me = FRUser.get();

			// Fake!!!!
			$scope.me = {
				food_roulette: { is_eating: false }
			};

	    	// $scope.me.food_roulette.is_eating will hold if user is in
			$scope.is_eating = function(bool) {
				$scope.me.food_roulette.is_eating = bool;
				$http.post(
					CONFIG.backend + '/roulette',
					{ data: { is_eating: bool } }
				);
			};
			

			$scope.logout = function() {
				console.log("LOGOUT");
				localStorageService.clearAll();
				$location.path(PATHS.LOGIN);
			};
		}
	]);
