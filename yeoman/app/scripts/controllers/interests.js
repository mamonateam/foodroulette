'use strict';

angular.module('foodroulette')
	.controller('InterestsCtrl', ['$scope', 'FRUser',
		function($scope, FRUser) {
			var fake_interests = {
				"Amateur Radio",
				"Macarrones",
				"Surfeo de Salon",
				"Burritos",
				"Zombies",
				"Poker"
			}
			
			/* FRUser.get().then(function(user) {
				if(user && user.interests) {
					$scope.interests = user.interests;
				}	
			}); */

			$scope.interests = fake_interests;
			
		}
	]);