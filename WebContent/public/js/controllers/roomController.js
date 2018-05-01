/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams) {

	$scope.roomid = '0001';
	$scope.meesage = '';

	$scope.localVideo;
	$scope.remoteVideo;
	$scope.peerConnection;
	$scope.peerConnectionConfig = {
		'iceServers': [{
				'url': 'stun:stun.services.mozilla.com'
			},
			{
				'url': 'stun:stun.l.google.com:19302'
			}
		]
	};


	$scope.init = function() {
		console.log('room');

		$scope.roomid = $stateParams.roomid;

		$scope.connection.onopen = (event) => {
			console.log('on open');
			$scope.connection.send("something");
		};
		$scope.connection.onmessage = (message) => {
			console.log(message);
		};



	}; // init

	$scope.pageReady = function() {
		localVideo = document.getElementById('localVideo');
		remoteVideo = document.getElementById('remoteVideo');

		serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
		serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected

		var constraints = {
			video: true;
			audio: true;
		};

		// TODO - this is the part that we need to test to make sure that adapterjs is working correctly:
		if (navigator.getUserMedia) {
			navigator.getUserMedia(constraints, (stream) => {
				// Success:
				localStream = stream;
				localVideo.src = window.URL.createObjectURL(stream);
			}, (error) => {
				console.log(error);
			});
		} else {
			window.alert("Sorry; your browser does not support the getUserMedia API.");
		}

		function start(isCaller) {
			peerConnection = new RTCPeerConnection(peerConnectionConfig);
			peerConnection.onicecandidate = gotIceCandidate;
			peerConnection.onaddstream = gotRemoteStream;
			peerConnection.addStream(localStream);

			if (isCaller) {
				peerConnection.createOffer(gotDescription, createOfferError);
			}
		}

		function gotDescription(description) {
			console.log('got description');
			peerConnection.setLocalDescription(description, function() {
				serverConnection.send(JSON.stringify({
					'sdp': description
				}));
			}, function() {
				console.log('set description error')
			});
		}

		function gotIceCandidate(event) {
			if (event.candidate != null) {
				serverConnection.send(JSON.stringify({
					'ice': event.candidate
				}));
			}
		}

		function gotRemoteStream(event) {
			console.log('got remote stream');
			remoteVideo.src = window.URL.createObjectURL(event.stream);
		}

		function createOfferError(error) {
			console.log(error);
		}
	}; // pageReady


	$scope.sendMessage = function() {
		$scope.connection.send("something");

	}



} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);