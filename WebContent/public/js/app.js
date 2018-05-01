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


}).controller("appCtrl", function($scope, $state, $stateParams) {

	$scope.connection = null;

	$scope.init = function() {
		console.log('test');
		$state.go('login');
	};
    $scope.MESSAGE_TYPES = {
        new_user: 0,
        rooms_list: 1
    };


    $scope.username = '';


    $scope.init = function (){
        console.log('test');
        $state.go('login');
    };
    
    $scope.createMessage = function (typeValue, fromValue, dataValue){
        return JSON.stringify({type: typeValue, from: fromValue, data: dataValue});
    }

});