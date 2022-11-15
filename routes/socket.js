/*
 * Serve content over a socket
 */

var _ = require('lodash');
var jsonfile = require('jsonfile');
var id, datas = {};

module.exports = function (io) {
  return function (socket) {
    socket.on('game:start', function (data) {
      id = data.data.id;
      datas[id] = data;
      data.game.round = 'J';
      io.emit('round:start', data);
    });

    socket.on('round:end', function (data) {
      if (data.round === 'J') {
        data.round = 'DJ';
        if (data.player_1.score < data.player_2.score && data.player_1.score < data.player_3.score) {
          data.control_player = 'player_1';
        }
        else if (data.player_2.score < data.player_1.score && data.player_2.score < data.player_3.score) {
          data.control_player = 'player_2';
        }
        else if (data.player_3.score < data.player_1.score && data.player_3.score < data.player_2.score) {
          data.control_player = 'player_3';
        }
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
        data.control_player = undefined;
      }
      else if (data.round === 'FJ') {
        data.round = 'end';

        var file = 'games/' + id + '-' + new Date().getTime() + '.json';
        jsonfile.writeFileSync(file, data, { spaces: 2 });
      }
      datas[id].game = data;
      io.emit('round:start', datas[id]);
    })

    socket.on('board:init', function () {
      socket.emit('board:init', datas[id]);
    });

    socket.on('game:init', function (data) {
      socket.emit('game:init', datas[data]);
    });

    socket.on('clue:start', function (data) {
      socket.broadcast.emit('clue:start', data);
    });

    socket.on('clue:daily', function (data) {
      socket.broadcast.emit('clue:daily', data);
    });

    socket.on('clue:end', function (data) {
      datas[id].game = data;
      socket.broadcast.emit('clue:end', data);
    });

    socket.on('buzzer:press', function (data) {
      socket.broadcast.emit('buzzer:press', data);
    });

    socket.on('buzzer:on', function (data) {
      socket.broadcast.emit('buzzer:on', data);
    });
    socket.on('buzzer:wrong', function (data) {
      // ToDo: Send the name of the team that got it wrong
      socket.broadcast.emit('buzzer:wrong', data);
    });
    socket.on('buzzer:off', function (data) {

      socket.broadcast.emit('buzzer:off', data);
    });
    socket.on('team:new', function (data) {

      socket.broadcast.emit('team:new', data);
    });
  };
};
