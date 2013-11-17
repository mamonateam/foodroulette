angular.module('foodroulette')
.controller('RouletteCtrl', ['$scope', 'FRUser', 'FRRoulette', function ($scope, FRUser, FRRoulette) {

  $scope.friends = [];

  var primary_chosen = false;

  var replaceSize = function(tmp, width, height) {
    return tmp.replace('{width}', width).replace('{height}', height);
  };

  FRRoulette.getStatus().success(function(data) {
    if(data.is_ready)
      angular.forEach(data.user_ids, function(id) {
        FRUser.getUser(id).success(function(data) {
          console.log('the user', data);
          if(!primary_chosen){
            data.primary = true;
            primary_chosen = true;
          }
          data.mugshot_url = replaceSize(data.mugshot_url_template, 200, 200);
          $scope.friends.push(data);
        });
      });
  });

  $scope.setPrimary = function(friend) {
    if(friend.primary)
      return;

    angular.forEach($scope.friends, function(f) {
      f.primary = false;
      f.messaging = false;
      f.expandInterests = false;
    });

    friend.primary = true;
  };
}]);
