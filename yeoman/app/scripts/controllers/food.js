'use strict';

angular.module('foodroulette')
	.controller('FoodCtrl', ['$scope', 'FRUser',
		function($scope, FRUser) {
			var fake_foods = [
				{
					title: "Indian",
					status: true
				},
				{
					title: "Vegetarian",
					status: true
				},
				{
					title: "Italian",
					status: true
				},
				{
					title: "Mexican",
					status: false
				},
				{
					title: "Spanish",
					status: false
				},
				{
					title: "Cuban",
					status: true
				}
			];

			var me = {
				food_roulette: {
					food_interests: []
				}
			};

			/*
			// We get all available food list
			$http.get({url: "scripts/fakedata/foods.json"}).then(function(allFoods) {
				// We get user food interests
				FRUser.get().then(function(user) {
					me = user;
					
					if(user && user.food_roulette && user.food_roulette.food_interests) {
						$scope.foods = {};
						// convert from array structure to object array structure
						for(var i = 0;i<allFoods.length;i++) {
							$scope.foods.push({
								title: allFoods[i],
								status: _.contains(user.food_roulette.food_interests, allFoods[i]);
							})
						}
					}
				});
			});
			*/

			$scope.updateFoods = function() {
				angular.forEach($scope.foods, function(food) {
					if(food.status)
						me.food_roulette.food_interests.push(food.title);
				});
				FRUser.set(me);
				console.log('updating', me);
			}

			$scope.enable = function(food) {
				food.status = true;
			};

			$scope.disable = function(food) {
				food.status = false;
			};

			// Init
			$scope.foods = fake_foods;
		}
	]);