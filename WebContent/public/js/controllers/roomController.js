/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams) {

	$scope.roomid = '0001';
	$scope.connection = null;
	$scope.meesage = '';

	$scope.localVideo;
	$scope.remoteVideo;
	$scope.peerConnection;


	$scope.init = function() {
		console.log('room');

		$scope.roomid = $stateParams.roomid;

		$scope.connection = new WebSocket('ws://' + window.location.hostname + ':8018');

		$scope.connection.onopen = (event) => {
			console.log('on open');
			$scope.connection.send("something");
		};
		$scope.connection.onmessage = (message) => {
			console.log(message);
		};



	};


<<<<<<< HEAD
=======
    $scope.sendMessage = function(){
        $scope.connection.send($scope.meesage);
>>>>>>> 9b3fb3d5dda3e97e384b5ceb8a52e38e087e5123

	$scope.sendMessage = function() {
		$scope.connection.send("something");

	}



}

collabApp.controller('roomCtrl', roomControllerFunction);