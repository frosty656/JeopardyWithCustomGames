'use strict';

angular.module('myApp.controllers').
  controller('ButtonCtrl', function ($scope, socket) {
    $scope.has_team_name = false;
    $scope.can_buzz = false;
    $scope.step = 1;
    $scope.button_timeout = false;
    console.log("Step 1")

    // Step one, get and submit team name
    $scope.submitTeamName = function () {
      $scope.has_team_name = true;
      socket.emit("buzzer:new", $scope.teamName);
      $scope.step = 2;
      console.log("Step 2")
    };

    // Step two allow team to buzz in when they should
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

    function timeout_button(){
      $scope.button_timeout = true;
      console.log("Button timeout for 250ms started")
      setTimeout(() => {
        console.log("Button timeout for 250ms ended")
        $scope.button_timeout = false;
      }, 500);
    }

    $scope.press = function () {
      if($scope.button_timeout){
        console.log("Button timeout")
        return
      }
      console.log("Not button timeout")
      if($scope.can_buzz){
        socket.emit('buzzer:press', $scope.teamName);
      }
      timeout_button();
    
    };

    // Wait until final jeopardy for step three
    socket.on('buzzer:finalJeopardy', function (data) {
      $scope.step = 3;
      console.log("Step 3")
    })
    // Step three get and submit final bid
    $scope.submitFinalBid = function () {
      $scope.has_team_name = true;
      socket.emit("buzzer:bid", { teamName: $scope.teamName, bid: parseInt($scope.bid) });
      $scope.step = 4;
      console.log("Step 4")
    };

    // Step four get and submit final answer
    $scope.submitFinalAnswer = function () {
      $scope.has_team_name = true;
      socket.emit("buzzer:answer", { teamName: $scope.teamName, answer: $scope.finalAnswer });

      $scope.step = 5;
      console.log("Step 5")
    };

    // Step five, wait for all answers to come in

    // Step six, show winner
    socket.on('buzzer:winner', function (data) {
      $scope.winner.name = data.name;
      $scope.winner.score = data.score;
      $scope.step = 6;
      console.log("Step 6")
    })
  });
