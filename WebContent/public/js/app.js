/**
 * Created by Mathew on 4/30/2018.
 */
"use strict";

var collabApp = angular.module("collabApp", ['ui.router']);

collabApp.config(function($stateProvider) {
	$stateProvider
		.state('lobby', {
			url: '/lobby',
			templateUrl: 'html/lobby.html',
			controller: 'lobbyCtrl'
		})
		.state('room', {
			url: '/room/{roomid}',
			templateUrl: 'html/room.html',
			controller: 'roomCtrl'
		})
		.state('login', {
			url: '/login',
			templateUrl: 'html/login.html',
			controller: 'loginCtrl'
		})


}).controller("appCtrl", function($scope, $state, $stateParams, $rootScope) {

	$scope.connection = null;

	$scope.init = function() {
		$state.go('login');
	};
    $scope.MESSAGE_TYPES = {
        new_user: 0,
        rooms_list: 1,
		ask_for_rooms: 2,
        create_room: 3,
        join_room: 4,
        leave_room: 5,
        user_joined: 6,
        user_left: 7,
        text_message: 8,
        request_user_list: 9,
        user_list: 10
    };


    $scope.username = '';
    $scope.color = '';


    $scope.init = function (){
        $state.go('login');
    };
    
    $scope.createMessage = function (data){
        return {from: $rootScope.username, data: data};
    };

    $scope.send = function(type, data) {
        $rootScope.socket.emit(type, $scope.createMessage(data));
    };


});