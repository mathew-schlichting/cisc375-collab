/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams, $rootScope) {

	$scope.roomid = '0001';
	$scope.meesage = '';

	$scope.localVideo;
	$scope.remoteVideo;
	$scope.localStream;
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

		console.log($rootScope.connection);

		$scope.localVideo = document.getElementById('localVideo');
		$scope.remoteVideo = document.getElementById('remoteVideo');

		serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
		serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected

		var constraints = {
			video: true,
			audio: true
		};

		// TODO - this is the part that we need to test to make sure that adapterjs is working correctly:
		if (navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					// Success:
					$scope.localStream = stream;
					console.log("in pageReady; $scope.localStream = " + $scope.localStream);
					// Older browsers may not have srcObject
					if ("srcObject" in $scope.localVideo) {
						$scope.localVideo.srcObject = stream;
					} else {
						// Avoid using this in new browsers, as it is going away.
						$scope.localVideo.src = window.URL.createObjectURL(stream);
					}
					console.log("getUserMedia success: $scope.localStream = " + stream);
					//		$scope.localVideo.src = window.URL.createObjectURL(stream);
				})
				.catch(function(error) {
					console.log(error);
				});
		} else {
			window.alert("Sorry; your browser does not support the getUserMedia API.");
		}
	}; // init

	$scope.start = (isCaller) => {
		console.log("in start! isCaller = " + isCaller);
		peerConnection = new RTCPeerConnection($scope.peerConnectionConfig);
		peerConnection.onicecandidate = gotIceCandidate;
		peerConnection.onaddstream = gotRemoteStream;
		peerConnection.addStream($scope.localStream);

		if (isCaller) {
			peerConnection.createOffer(gotDescription, createOfferError);
		}
	};



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
		$scope.remoteVideo.src = window.URL.createObjectURL(event.stream);
	}

	function createOfferError(error) {
		console.log(error);
	}

	function gotMessageFromServer(message) {
		if (!peerConnection) start(false);

		var signal = JSON.parse(message.data);
		if (signal.sdp) {
			peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				if (signal.sdp.type == 'offer') {
					peerConnection.createAnswer(gotDescription, createAnswerError);
				}
			});
		} else if (signal.ice) {
			peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
		}
	}


	$scope.sendMessage = function() {
		$rootScope.connection.send("something");
	}

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);