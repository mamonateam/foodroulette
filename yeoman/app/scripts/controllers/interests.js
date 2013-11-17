'use strict';

angular.module('foodroulette')
	.controller('InterestsCtrl', ['$scope', 'FRUser',
		function($scope, FRUser) {
			var fake_interests = [
				{
					title: "Amateur Radio",
					status: true
				},
				{
					title: "Macarrones",
					status: true
				},
				{
					title: "Surfeo de Salon",
					status: true
				},
				{
					title: "Burritos",
					status: true
				},
				{
					title: "Zombies",
					status: false
				},
				{
					title: "Poker",
					status: false
				}
			];

			var me = {
				interests: []
			};

			/*
			// We get all available interests list
			$http.get({url: "scripts/fakedata/interests.json"}).then(function(allInterests) {
				// We get user interests
				FRUser.get().then(function(user) {
					me = user;
					if(user && user.interests) {
						$scope.interests = {};

						// convert from array structure to object array structure
						for(var i = 0;i<allInterests.length;i++) {
							$scope.interests.push({
								title: allInterests[i],
								status: _.contains(user.interests, allInterests[i]);
							})
						}
					}
				});
			});
			*/

			$scope.updateInterests = function() {
				angular.forEach($scope.interests, function(interest) {
					if(interest.status)
						me.interests.push(interest.title);
				});
				FRUser.set(me);
				console.log('updating', me);
			}

			$scope.enable = function(interest) {
				interest.status = true;
			};

			$scope.disable = function(interest) {
				interest.status = false;
			};

			// Init
			$scope.interests = fake_interests;
		}
	]);
