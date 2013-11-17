'use strict';

angular.module('LocalStorageModule').value('prefix', 'foodroulette');
angular
  .module('foodroulette', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'LocalStorageModule'
  ])

  .constant('PATHS', {    
		LOGIN: '/login',
    LOGIN_MD5: '/login/:md5',
		INTERESTS: '/interests',
		FOOD: '/food',
		IMIN: '/imin',
		ROULETTE: '/roulette'
	})

  .constant('CONFIG', {
    backend: 'http://ch-foodroulette.herokuapp.com/api'
  })

  .config(['$httpProvider',function(provider){
    provider.defaults.headers.common['X-CSRF-Token'] = $('meta[name=csrf-token]').attr('content');
    provider.defaults.useXDomain = true;
    delete provider.defaults.headers.common['X-Requested-With'];
  }])

  .config(function ($routeProvider, PATHS) {
    $routeProvider
      .when(PATHS.LOGIN, {
      	templateUrl: 'views/login.html',
      	controller: 'LoginCtrl'
      })
      .when(PATHS.LOGIN_MD5, {
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
