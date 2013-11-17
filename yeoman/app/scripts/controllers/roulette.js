angular.module('foodroulette')
.controller('RouletteCtrl', ['$scope', function ($scope) {

  $scope.friends = [
    {
      name: 'WAT Juakinee',
      department: 'Orly Relationships',
      picture: 'http://static4.fjcdn.com/comments/Somebody+call+the+sWAT+team+someone+just+broke+the+law+_ee96a5b72089d1478b85c02ec7d1451b.jpg',
      interests: ['Sky surfing', 'Guacamole', 'Lentejas', 'King of Fighters', 'Tennis', 'Whales', 'Folsom Fair', 'Bridges']
    },
    {
      name: 'IDC Ming',
      department: 'Hackathon Engineering',
      picture: 'http://images.wikia.com/regularshow/es/images/b/b6/Meme-white_00242335.jpg',
      interests: ['Sky surfing', 'Guacamole', 'Lentejas', 'King of Fighters', 'Tennis', 'Whales', 'Folsom Fair', 'Bridges']
    }
  ];

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

  $scope.setPrimary($scope.friends[0]);
}]);
