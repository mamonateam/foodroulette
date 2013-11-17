'use strict';

angular.module('foodroulette', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute'
])
	.constant('PATHS', {
		LOGIN: '/login',
		INTERESTS: '/interests',
		FOOD: '/food',
		IMIN: '/imin',
		ROULETTE: '/roulette'
	})
  .constant('CONFIG', {
    backend: 'http://ch-foodroulette.herokuapp.com/'
  })
  .config(function ($routeProvider, PATHS) {
    $routeProvider
      .when(PATHS.LOGIN, {
      	templateUrl: 'views/login.html',
      	controller: 'LoginCtrl'
      })
      .when(PATHS.INTERESTS, {
      	templateUrl: 'views/interests.html',
      	controller: 'InterestsCtrl'
      })
      .when(PATHS.FOOD, {
      	templateUrl: 'views/food.html',
      	controller: 'FoodCtrl'
      })
      .when(PATHS.IMIN, {
      	templateUrl: 'views/imin.html',
      	controller: 'ImInCtrl'
      })
      .when(PATHS.ROULETTE, {
      	templateUrl: 'views/roulette.html',
      	controller: 'RouletteCtrl'
      })
      .otherwise({ redirectTo: PATHS.IMIN });
  });
