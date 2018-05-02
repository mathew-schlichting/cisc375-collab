/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams, $rootScope, $compile) {

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
		$rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.text_message, $rootScope.username, $scope.message));
		$scope.message = '';
	}

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);