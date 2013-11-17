angular.module('foodroulette')
	.controller('LoginCtrl', ['$scope', '$routeParams', '$location', 'localStorageService', 'PATHS',
		function ($scope, $routeParams, $location, localStorageService, PATHS) {

			if($routeParams.md5) {
				console.log("md5 received from Yammer: " + $routeParams.md5);
				localStorageService.add('md5',$routeParams.md5);
				$location.path(PATHS.INTERESTS);
			}

		}
	]);
