'use strict';

angular.module('foodroulette')
	.controller('FoodCtrl', ['$scope', '$http', '$location', 'FRUser',

    function($scope, $http, $location, FRUser) {
      var me;
			// We get all available food list
			$http.get('scripts/fakedata/foods.json').then(function(response) {
        var allFoods = response.data;

				// We get user food interests
				FRUser.get().then(function(user) {
          if(user) {
            me = user;
						$scope.foods = [];
						// convert from array structure to object array structure
            angular.forEach(allFoods, function(food) {
							$scope.foods.push({
								title: food,
								status: _.contains(me.food_roulette.food_preferences, food)
							});
						});
					}
				});
			});

			$scope.save = function() {
				me.food_roulette.food_preferences = [];

        angular.forEach($scope.foods, function(food) {
					if(food.status)
						me.food_roulette.food_preferences.push(food.title);
				});

        FRUser.update().success(function() {
          $location.path('/');
        });
			}

			$scope.enable = function(food) {
				food.status = true;
			};

			$scope.disable = function(food) {
				food.status = false;
			};
		}
	]);
