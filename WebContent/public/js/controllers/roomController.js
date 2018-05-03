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
		$scope.roomid = $stateParams.roomid;


        $scope.send('request_users');

        if(!$rootScope.socket.hasListeners('user_list')) {
            $rootScope.socket.on('user_list', (message) => {
                $scope.receivedUserList(message.data);
            });
        }

        if(!$rootScope.socket.hasListeners('text_message')) {
            $rootScope.socket.on('text_message', (message) => {
                $scope.receivedTextMessage(message.data.message, message.data.color);
            });
        }



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

	$scope.receivedUserList = function(list) {
        var html = '';
        var element = $('#userList');

        for (var i = 0; i < list.length; i++) {
            html += '<li id="' + list[i].username + '" class="list-group-item user-item"><div id="' + list[i].username + '-color" class="user-color"></div><div>' + list[i].username + '</div></li>';
        }
        element.html(html);
        $compile(element.contents())($scope);

        for (i = 0; i < list.length; i++) {
            element = $('#' + list[i].username + '-color');
            element.css('border-radius', '50%');
            element.css('background-color',list[i].color);
            $compile(element.contents())($scope);
        }
	};

	$scope.receivedTextMessage = function(message, color){
        var element = $('#messageList');
        element.html(element.html() + '<li class="list-group-item message"><div id="temp-color" class="user-color"></div><div class="pull-right">' + message + '</div></li>');
        $compile(element.contents())($scope);

        element = $('#temp-color');
        element.css('border-radius', '50%');
        element.css('background-color', color);
        element.attr('id', '');
        $compile(element.contents())($scope);
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
		$scope.send('text_message', {message: $scope.message});
		$scope.message = '';
	}

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);