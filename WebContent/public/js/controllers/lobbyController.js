/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state) {


	$scope.init = function() {
		console.log('lobby');

		$scope.connection = new WebSocket('ws://' + window.location.hostname + ':8018');

		// This will send a "create user" event
		$scope.connection.onopen = (event) => {
			console.log('on open');
			$scope.connection.send("something");
		};
		$scope.connection.onmessage = (message) => {
			console.log(message);
		};
	};

	$scope.joinRoom = function(id) {
		$state.go('room', {
			roomid: id
		});
	};

	$scope.createRoom = function() {
		console.log('in here');
		var id = Math.floor(8999 * Math.random()) + 1111;
		$scope.joinRoom(id);
	};



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);