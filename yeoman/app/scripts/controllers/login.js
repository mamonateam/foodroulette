angular.module('foodroulette')
.controller('LoginCtrl', ['$scope', function ($scope) {

  //Init Yammer login button
  yam.connect.loginButton('#yammer-login', function (resp) {
    if (resp.authResponse)
      document.getElementById('yammer-login').innerHTML = 'Welcome to Yammer!';
  });

}]);
