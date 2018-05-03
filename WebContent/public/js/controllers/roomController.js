/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams, $rootScope, $compile) {

	$scope.roomid = '0001';
	$scope.meesage = '';

	$scope.localVideo = $('#localVideo');
	$scope.remoteVideo = $('#remoteVideo');
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
	$scope.serverConnection;

	// We'll want to use adapterjs to avoid the following lines:
	navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;
	window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
	window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;



	$scope.init = function() {
		console.log('room');

		$scope.roomid = $stateParams.roomid;


		$rootScope.connection.onmessage = (event) => {
			var message = JSON.parse(event.data);

			if (message.type === $scope.MESSAGE_TYPES.text_message) {

				var element = $('#messageList');
				element.html(element.html() + '<li class="list-group-item message"><div id="temp-color" class="user-color"></div><div class="pull-right">' + message.data.message + '</div></li>');
				$compile(element.contents())($scope);

				element = $('#temp-color');
				element.css('border-radius', '50%');
				element.css('background-color', message.data.color);
				element.attr('id', '');
				$compile(element.contents())($scope);


			} else if (message.type === $scope.MESSAGE_TYPES.user_joined) {
				//might not need....
				var element = $('#userList');
				element.html(element.html() + '<li id="' + message.from + '" class="list-group-item">' + message.from + '</li>');
				$compile(element.contents())($scope);

			} else if (message.type === $scope.MESSAGE_TYPES.user_list) {
				var html = '';
				var element = $('#userList');

				for (var i = 0; i < message.data.length; i++) {
					html += '<li id="' + message.data[i].username + '" class="list-group-item user-item"><div id="' + message.data[i].username + '-color" class="user-color"></div><div>' + message.data[i].username + '</div></li>';
				}
				element.html(html);
				$compile(element.contents())($scope);

				for (i = 0; i < message.data.length; i++) {
					element = $('#' + message.data[i].username + '-color');
					element.css('border-radius', '50%');
					element.css('background-color', message.data[i].color);
					$compile(element.contents())($scope);
				}
			}


		};

		$rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.request_user_list, $rootScope.username));

		$scope.serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
		// TODO - the following line will change drastically with socket.io:
		//	$scope.serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected

		// The following section is from https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/gum/js/main.js:

		var video = $('#localVideo');
		console.log(video);
		var constraints = window.constraints = {
			audio: false,
			video: true
		};

		function handleSuccess(stream) {
			var videoTracks = stream.getVideoTracks();
			console.log('Got stream with constraints:', constraints);
			console.log('Using video device: ' + videoTracks[0].label);
			stream.oninactive = function() {
				console.log('Stream inactive');
			};
			window.stream = stream; // make variable available to browser console
			video.srcObject = stream;
		}

		function handleError(error) {
			if (error.name === 'ConstraintNotSatisfiedError') {
				errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
					constraints.video.width.exact + ' px is not supported by your device.');
			} else if (error.name === 'PermissionDeniedError') {
				errorMsg('Permissions have not been granted to use your camera and ' +
					'microphone, you need to allow the page access to your devices in ' +
					'order for the demo to work.');
			}
			errorMsg('getUserMedia error: ' + error.name, error);
		}

		function errorMsg(msg, error) {
			console.log(msg);
			/*
			errorElement.innerHTML += '<p>' + msg + '</p>';
			if (typeof error !== 'undefined') {
				console.error(error);
			}
            */
		}

		navigator.mediaDevices.getUserMedia(constraints).
		then(handleSuccess).catch(handleError);
	}; // init

	/*********************** Attempts to display video of ourselves ******************/
	/*
        var constraints = {
			video: true,
			audio: true
		};

		//console.log(navigator);

		// TODO - this is the part that we need to test to make sure that adapterjs is working correctly:
		if (navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {

					var videoTracks = stream.getVideoTracks();
					for (var i = 0; i < videoTracks.length; i++) {
						console.log(videoTracks[i]);
					}

					// Success:
					$scope.localStream = stream;
					// Older browsers may not have srcObject
					console.log($scope.localVideo);
					//	if ("srcObject" in $scope.localVideo) {
					$scope.localVideo.srcObject = stream;
					/*	} else {
						// Avoid using this in new browsers, as it is going away.
						$scope.localVideo.src = window.URL.createObjectURL(stream);
						console.log($scope.localVideo.src);
					}
                    */
	/*			console.log(stream);
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
		console.log("start functionality coming soon!");
	};

*/
	/*************** Attempts to send that video/display others *****************/
	/*
			$scope.peerConnection = new RTCPeerConnection($scope.peerConnectionConfig);
			console.log($scope.peerConnection);
			try {
				$scope.peerConnection.onicecandidate = gotIceCandidate;
			} catch (error) {
				console.log(error);
			}
			try {
				//$scope.peerConnection.onaddstream = gotRemoteStream;
				$scope.peerConnection.ontrack = gotRemoteStream;
			} catch (error) {
				console.log(error);
			}
			try {
				console.log(" --- trying to add the stream --- ");
				//$scope.peerConnection.addStream($scope.localStream);
				$scope.localStream.getTracks().forEach(function(track) {
					$scope.peerConnection.addTrack(track, $scope.localStream);
				});
				console.log($scope.peerConnection.getLocalStreams());
			} catch (error) {
				console.log(error);
			}

			if (isCaller) {
				$scope.peerConnection.createOffer(gotDescription, createOfferError);
			}
		};



		function gotDescription(description) {
			console.log('got description');
			$scope.peerConnection.setLocalDescription(description, function() {
				$scope.serverConnection.send(JSON.stringify({
					'sdp': description
				}));
			}, function() {
				console.log('set description error')
			});
		}

		function gotIceCandidate(event) {
			if (event.candidate != null) {
				console.log(event.candidate);
				$scope.serverConnection.send(JSON.stringify({
					'ice': event.candidate
				}));
			}
		}

		function gotRemoteStream(event) {
			console.log('got remote stream');
			console.log(event);
			$scope.remoteVideo.src = window.URL.createObjectURL(event.stream);
			console.log($scope.remoteVideo);
		}

		function createOfferError(error) {
			console.log(error);
		}
*/
	function gotMessageFromServer(message) {
		if (!$scope.peerConnection) start(false);

		var signal = JSON.parse(message.data);
		if (signal.sdp) {
			$scope.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				if (signal.sdp.type == 'offer') {
					$scope.peerConnection.createAnswer(gotDescription, createAnswerError);
				}
			});
		} else if (signal.ice) {
			$scope.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
		}
	}


	$scope.sendMessage = function() {
		$rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.text_message, $rootScope.username, $scope.message));
		$scope.message = '';
	}

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);