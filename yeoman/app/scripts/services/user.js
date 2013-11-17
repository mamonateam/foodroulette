angular.module('foodroulette')
.factory('FRUser', ['$http', 'CONFIG',
  function ($http, CONFIG) {
      var me;

    function getMe() {
      if(me)
        return me;
      else
      return me = $http.get(CONFIG.backend + "/user/me");
    }

    function getUser(id) {
      return $http.get({url: CONFIG.backend + "/user/" + id});
    }

    function update() {
      return $http.post({
        url: CONFIG.backend + "/user/me",
        data: me
      });
    }

    return {
      // if id is null returns 'me'
      get: getMe,
      getUser: getUser,
      /* update - updates information contained in the service */
      update: update
    };
  }
])
