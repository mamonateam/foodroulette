angular.module('foodroulette')
	.controller('LoginCtrl', ['$scope', '$routeParams', '$location', 'FRUser', 'PATHS',
		function ($scope, $routeParams, $location, FRUser, PATHS) {

			if($routeParams.md5) {
				localStorageService.add('md5',$routeParams.md5);
				$location.path(PATHS.IMIN);
			}

		}
	]);
