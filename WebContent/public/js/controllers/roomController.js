/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams, $rootScope, $compile) {

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




        $rootScope.connection.onmessage = (event)=> {
            var message = JSON.parse(event.data);

            if(message.type === $scope.MESSAGE_TYPES.text_message){
            	var element = $('#messageList');
            	element.html(element.html() + '<li class="list-group-item">' + message.data + '</li>');
                $compile(element.contents())($scope);
			} else if(message.type === $scope.MESSAGE_TYPES.user_joined){
                //might not need....
            	var element = $('#userList');
                element.html(element.html() + '<li id="' + message.from + '" class="list-group-item">' + message.from + '</li>');
                $compile(element.contents())($scope);
			} else if(message.type === $scope.MESSAGE_TYPES.user_list){
				console.log('IN USER LIST MESSAGE');
				console.log(message.data);
				var html = '';
                var element = $('#userList');

                for(var i=0;i<message.data.length; i++){
					html += '<li id="' + message.data[i] + '" class="list-group-item">' + message.data[i] + '</li>';
				}
                element.html(html);
                $compile(element.contents())($scope);
			}

        };

        $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.request_user_list, $rootScope.username));


    }; // init

	$scope.pageReady = function() {
		localVideo = document.getElementById('localVideo');
		remoteVideo = document.getElementById('remoteVideo');

		serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
		serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected

		var constraints = {
			video: true,
			audio: true
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
			peerConnection = new RTCPeerConnection($scope.peerConnectionConfig);
			peerConnection.onicecandidate = gotIceCandidate;
			peerConnection.onaddstream = gotRemoteStream;
			peerConnection.addStream($scope.localStream);

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
	}; // pageReady


	$scope.sendMessage = function() {
        $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.text_message, $rootScope.username, $scope.message));
	}

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);