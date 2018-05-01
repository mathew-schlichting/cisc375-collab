/**
 * Created by Mathew on 4/30/2018.
 */
"use strict";

var collabApp = angular.module("collabApp", ['ui.router']);

collabApp.config(function($stateProvider) {
    $stateProvider
        .state('lobby', { url: '/lobby', templateUrl: 'html/lobby.html', controller: 'lobbyCtrl'})
        .state('room', { url: '/room/{roomid}', templateUrl: 'html/room.html', controller: 'roomCtrl'})
        .state('login', { url: '/login', templateUrl: 'html/login.html', controller: 'loginCtrl'})


}).controller("appCtrl", function($scope, $state, $stateParams) {

    $scope.init = function (){
        console.log('test');
        $state.go('login');
    };

});
