angular.module('foodroulette')
.factory('FRUser', ['$http', '$q', 'CONFIG',
  function ($http, $q, CONFIG) {
      var me;

    function getMe() {
      var response = $q.defer();

      if(me)
        response.resolve(me);
      else
        $http.get(CONFIG.backend + "/user/me").success(function(data) {
          me = data;
          response.resolve(me);
        });

      return response.promise;
    }

    function getUser(id) {
      return $http.get(CONFIG.backend + "/user/" + id);
    }

    function update() {
      return $http.post(CONFIG.backend + "/user/me", me);
    }

    return {
      // if id is null returns 'me'
      get: getMe,
      getUser: getUser,
      /* update - updates information contained in the service */
      update: update
    };
  }
]);
