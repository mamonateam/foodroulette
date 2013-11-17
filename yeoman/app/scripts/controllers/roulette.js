angular.module('foodroulette')
.controller('RouletteCtrl', ['$scope', '$http', '$location', '$timeout', 'CONFIG', 'FRUser', 'FRRoulette', function ($scope, $http, $location, $timeout, CONFIG, FRUser, FRRoulette) {

  $scope.friends = [];

  var primary_chosen = false;
  var pooler = null;

  var runPool = function() {
    pooler = $timeout(function() {
      FRRoulette.getStatus().success(function(data) {
        if(data.is_ready)
          runPool();
        else{
          $timeout.cancel(pooler);
          $location.path('/imin');
        }
      });
    }, CONFIG.pollTime);
  };

  var replaceSize = function(tmp, width, height) {
    return tmp.replace('{width}', width).replace('{height}', height);
  };

  FRRoulette.getStatus().success(function(data) {
    if(data.is_ready){
      angular.forEach(data.user_ids, function(id) {
        FRUser.getUser(id).success(function(data) {
          if(!primary_chosen){
            data.primary = true;
            primary_chosen = true;
          }
          data.mugshot_url = replaceSize(data.mugshot_url_template, 200, 200);
          $scope.friends.push(data);
        });
      });
      runPool();
    }
    else
      $location.path('/imin');
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

  $scope.sendMessage = function(friend) {
    if(friend.message){
      $http.post(CONFIG.backend + "/message", {
        user_id: friend.id,
        body: friend.message
      }).success(function() {
        $scope.cancelMessage(friend);
      }).error(function() {
        alert('Error sending message, please try again...');
      });
    } else {
      $scope.cancelMessage(friend);
    }
  };

  $scope.cancelMessage = function(friend) {
    friend.messaging = false;
    friend.message = null;
  };
}]);
