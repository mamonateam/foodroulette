'use strict';

angular.module('foodroulette')
	.controller('ImInCtrl', ['$scope', '$location','FRUser', 'PATHS', 'CONFIG',
		function($scope, $location, FRUser, PATHS, CONFIG) {
			// Are we logged in? if not we move to login screen
			$scope.me = FRUser.get().error(function() {
				$location.path(PATHS.LOGIN);
			});

			// $scope.me.food_roulette.imin will hold if user is in
			$scope.imin = function(bool) {
				$scope.me.food_roulette.imin = bool;
				$http.post(CONFIG.backend + '/roulette',
					{
						data: { imin: bool }
					});
			}
		}
	]);
