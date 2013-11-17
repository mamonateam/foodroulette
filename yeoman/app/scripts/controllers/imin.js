'use strict';

angular.module('foodroulette')
	.controller('ImInCtrl', ['$scope', '$location','FRUser', 'PATHS',
		function($scope, $location, FRUser, PATHS) {
			// Are we logged in? if not we move to login screen
			FRUser.get().error(function(user) {
				$location.path(PATHS.LOGIN);
			});
		}
	]);
