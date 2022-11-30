'use strict';

/* Controllers */

angular.module('myApp.controllers').
  // controller('SeasonsCtrl', function ($scope, response) {
  //   $scope.data = response.data;
  // }).
  controller('SeasonCtrl', function ($scope, $stateParams, response) {
    $scope.id = $stateParams.id;
    $scope.data = response.data;
    $scope.deleteGame = function (id) {
      console.log('deleteGame', id);
      // Make a rest request to delete the game
      fetch('/api/deleteGame/', {
        method: 'POST',
        body: JSON.stringify({Id: id}), // string or object
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if(res.status != 200) {
          alert('Error deleting game');
        } else {
          // Remove the game from the list
          $scope.data = $scope.data.filter(function (game) {
            return game.id != id;
          });

          // Update the view
          $scope.$apply();

        }
      });
    };  
  });
