'use strict';

angular.module('myApp.controllers').
  controller('GameClueCtrl', function ($scope, $modalInstance, response, socket) {
    console.log(response)
    $scope.category = response.category;
    $scope.clue_text = response.clue_text;
    $scope.clue = response.clue;
    $scope.game = response.game;
    $scope.result = {
      player_1: {},
      player_2: {},
      player_3: {},
      dd_player: response.game.control_player
    };
    $scope.active_team = '.'
    $scope.allow_buzz = false;
    $scope.finished_reading = false;


    var value = response.id.split('_');
    $scope.result.value = $scope.result.dd_value = parseInt(value[3]) * (value[1] === 'J' ? 200 : 400);
    
    socket.on('buzzer:press', function (data) {
      if($scope.allow_buzz){
        if (data) {
          $scope.active_team = data;
          $scope.allow_buzz = false;
          socket.emit("buzzer:off", data);
        }
      }
    })

    socket.on("buzzer:answer", function (data) {
      [1,2,3].forEach(function (num) {
        var key = 'player_' + num;
        if($scope.game[key].name == data.teamName) {
          console.log($scope.game[key].name, data.teamName)

          $scope.game[key].FJAnswer = data.answer;
        }
      })

    }) 

    $scope.allowBuzz = function () {
      socket.emit('buzzer:on');
      $scope.allow_buzz = true;
      $scope.finished_reading = true;
    }

    $scope.setResult = function (num, correct) {
      var key = 'player_' + num;
      $scope.result[key][correct ? 'right' : 'wrong'] = !$scope.result[key][correct ? 'right' : 'wrong'];
      $scope.result[key][correct ? 'wrong' : 'right'] = undefined;

      var team_name = ""
      if($scope.game[key] === undefined || $scope.game[key].name === undefined) {
        team_name = "Team " + num
      } else {
        team_name = $scope.game[key].name
      }
      if ($scope.result[key].right && response.id !== 'clue_FJ') {
        if (num === 1) {
          $scope.result.player_2.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 2) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 3) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_2.right = undefined;
        }
        socket.emit('buzzer:off', response.id);
      } else {
        socket.emit("buzzer:wrong", team_name);
      }
      $scope.active_team = '.'
      if(correct){
        $scope.allow_buzz = false;
      } else {
        socket.emit('buzzer:wrong', team_name)
        $scope.allow_buzz = true;
      }
    };

    $scope.setDDValue = function () {
      $scope.result.value = parseInt($scope.result.dd_value);
      $scope.result.dd_confirm = true;
      socket.emit('clue:daily', response.id);
    };

    $scope.setDDResult = function (correct) {
      $scope.result.dd_result = correct;
    };

    $scope.ok = function () {
      var result = {};
      if ($scope.clue.daily_double) {
        $scope.result[$scope.result.dd_player] = $scope.result[$scope.result.dd_player] || {};
        $scope.result[$scope.result.dd_player][$scope.result.dd_result ? 'right' : 'wrong'] = true;
      }
      result[response.id] = $scope.result;
      $scope.allow_buzz = false;

      $modalInstance.close(result);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
