'use strict';

angular.module('myApp.controllers').
  controller('GameCtrl', function ($scope, $modal, response, socket) {
    $scope.data = response.data;
    $scope.hideComments = {};

    socket.emit('game:init', $scope.data.id);

    socket.on('game:init', function (data) {
      if (data) {
        $scope.game = data.game;
      }
    })

    socket.on('round:start', function (data) {
      $scope.game = data.game;
    });

    socket.on('team:new', function (data) {
      [1, 2, 3].every(function (num) {
        var key = 'player_' + num
        if($scope.game[key] === undefined || $scope.game[key].name === undefined|| $scope.game[key].name === '') {
          var name = data;
          $scope.game[key] = { name };
          return false
        }
        return true
      })
    })

    $scope.startGame = function () {
      socket.emit('game:start', {
        data: $scope.data,
        game: $scope.game
      }, null);
    };

    $scope.startClue = function (id) {
      socket.emit('clue:start', id);
      var modalInstance = $modal.open({
        templateUrl: 'partials/gameclue',
        controller: 'GameClueCtrl',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        openedClass: 'game-modal-open',
        resolve: {
          response: function () {
            var split = id.split('_').slice(0, 3);
            split[0] = 'category';

            if (split.length === 2) {
              split.push(1);
            }

            return {
              id: id,
              category: $scope.data[split.join('_')],
              clue: $scope.data[id],
              game: $scope.game
            };
          }
        }
      });

      modalInstance.result.then(function (result) {
        angular.extend($scope.game, result);

        // Keep score.
        result = result[id];
        [1, 2, 3].forEach(function (num) {
          var key = 'player_' + num
          $scope.game[key] = $scope.game[key] || {};
          $scope.game[key].score = $scope.game[key].score || 0;

          var value = id === 'clue_FJ' ? parseInt($scope.game[key].fj_wager) : result.value;

          if (result[key] && result[key].right) {
            $scope.game[key].score += value;
            $scope.game.control_player = key;
          }
          else if (result[key] && result[key].wrong) {
            $scope.game[key].score -= value;
          }
        });
        socket.emit('clue:end', $scope.game);
      });
    };

    $scope.endRound = function () {
      socket.emit('round:end', $scope.game);
    };

    socket.on('buzzer:bid', function (data) {
      if (data) {
        [1,2,3].forEach(function (i) {
          var key = 'player_' + i;
          if(data.teamName == $scope.game[key].name) {
            $scope.game[key].fj_wager = data.bid;
          }
        })
      }
    })

    $scope.toggleComments = function (category) {
      $scope.hideComments[category] = !$scope.hideComments[category];
    }

    $scope.resetGame = function () {
      $scope.game = {
        control_player: 'player_1'
      };
    };
    $scope.resetGame();
  });
