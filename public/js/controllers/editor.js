'use strict';

angular.module('myApp.controllers').
  controller('EditorCtrl', function ($scope, socket, response) {
    $scope.game = response.data;
    $scope.save = function () {
        // Get the value of id game_title
        var game_title = document.getElementById('game_title').value;
        if(game_title == '') {
            alert('Please enter a title for your game');
            return;
        }
        // make a rest call to save the game
        fetch('/api/saveCustomGame', {
          method: 'POST',
          body: JSON.stringify($scope.game), // string or object
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if(res.status != 200) {
            alert('Error saving game');
          }
        });
    };
  });
