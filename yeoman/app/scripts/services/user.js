angular.module('foodroulette')
.factory('FRUser', ['$http', 'CONFIG',
  function ($http, CONFIG) {
      var me;

    function getMe() {
      return me || me = $http.get({url: CONFIG.backend + "/user/me"});
    }

    function setMe(mod_me) {
      return me = mod_me;
    }

    function getUser(id) {
      return $http.get({url: CONFIG.backend + "/user/" + id});
    }

    function sendToken(yammer_user_id, token) {
      return $http.post({
        url: CONFIG.backend + "/user/register",
        data: {
          yammer_id: yammer_user_id,        
          token: token
        }
      });
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
      set: setMe,
      getUser: getUser,
      // registers token
      sendToken: sendToken,
      /* update - updates information contained in the service */ 
      update: update
    };
  }
])
