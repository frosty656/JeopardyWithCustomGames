'use strict';

angular.module('myApp.controllers').
  controller('ButtonCtrl', function ($scope, socket) {
    $scope.has_team_name = false;
    $scope.can_buzz = false;

    socket.on('buzzer:on', function (data) {
      if($scope.has_team_name){
        $scope.can_buzz = true;
      }
    })
    socket.on('buzzer:off', function (data) {
      if($scope.has_team_name){
        $scope.can_buzz = false;
      }
    })
    socket.on('buzzer:wrong', function (data) {
      if($scope.has_team_name){
        if($scope.teamName === data){
          $scope.can_buzz = false;
        } else {
          $scope.can_buzz = true;
        }
      }
    })

    $scope.submit = function () {
      $scope.has_team_name = true;
      socket.emit("team:new", $scope.teamName);
      console.log('Sending team:new ' + $scope.teamName)
    };

    $scope.press = function () {
      if($scope.can_buzz){
        console.log('Sending buzzer:press ' + $scope.teamName);

        socket.emit('buzzer:press', $scope.teamName);
      } else {
        console.log("Buzzing disabled");
      }
    };
  });
