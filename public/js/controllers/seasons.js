'use strict';

/* Controllers */

angular.module('myApp.controllers',[]).
  controller('SeasonsCtrl', function ($scope, response) {
    $scope.data = response.data;
  });
