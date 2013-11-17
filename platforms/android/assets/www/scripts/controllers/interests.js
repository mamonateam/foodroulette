'use strict';

angular.module('foodroulette')
	.controller('InterestsCtrl', ['$scope', '$http', 'FRUser',

		function($scope, $http, FRUser) {
			var me;
			// We get all available interests list
			$http.get('scripts/fakedata/interests.json').then(function(response) {
				var allInterests = response.data;

				// We get user interests
				FRUser.get().then(function(user) {
					if(user) {
						me = user;
						$scope.interests = [];

						// convert from array structure to object array structure
						angular.forEach(allInterests, function(interest) {
							$scope.interests.push({
								title: interest,
								status: _.contains(me.interests, interest)
							});
						});
					}
				});
			});

			$scope.updateInterests = function() {
				me.interests = [];
				angular.forEach($scope.interests, function(interest) {
					if(interest.status)
						me.interests.push(interest.title);
				});
			}

			$scope.enable = function(interest) {
				interest.status = true;
			};

			$scope.disable = function(interest) {
				interest.status = false;
			};
		}
	]);
