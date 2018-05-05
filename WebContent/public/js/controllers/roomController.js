/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $state, $stateParams, $rootScope, $compile) {

    $scope.roomid = '0001';
    $scope.meesage = '';

    $scope.localVideo = $('#localVideo')[0];
    $scope.remoteVideo = $('#remoteVideo')[0];
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

    console.log(navigator.mediaDevices.getUserMedia);
    console.log(navigator.mediaDevices.mozGetUserMedia);
    console.log(navigator.mediaDevices.webkitGetUserMedia);
    // We'll want to use adapterjs to avoid the following lines:
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;



    $scope.init = function() {
        $scope.roomid = $stateParams.roomid;

        
        $scope.send('request_users');

        if (!$rootScope.socket.hasListeners('user_list')) {
            $rootScope.socket.on('user_list', (message) => {
                $scope.receivedUserList(message.data);
            });
        }

        if (!$rootScope.socket.hasListeners('text_message')) {
            $rootScope.socket.on('text_message', (message) => {
                console.log(message);
                $scope.receivedTextMessage(message.data.message, message.data.color);
            });
        }

        if (!$rootScope.socket.hasListeners('start_call')) {
            $rootScope.socket.on('start_call', (message) => {

                // (message.from !== $rootScope.userName)
            });
        }
        
        var element = $('#nav-section');
        element.html('<div class="btn btn-danger" ng-click="leaveRoom();">Leave Room</div>');
        $compile(element.contents())($scope);



        //$scope.serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
        // TODO - the following line will change drastically with socket.io:
        //	$scope.serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected
        //var socket = io('http://localhost:8018');
        //$rootsocket.on('connection', function (data) {
        //    console.log(data);
        //    socket.emit('my other event', { my: 'data' });
        //});


        /*********************** Attempts to display video of ourselves ******************/

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
                    console.log($scope.localStream);
                    // Older browsers may not have srcObject
                    console.log($scope.localVideo);
                    if ("srcObject" in $scope.localVideo) {
                        $scope.localVideo.srcObject = stream;
                    } else {
                        // Avoid using this in new browsers, as it is going away.
                        $scope.localVideo.src = window.URL.createObjectURL(stream);
                        console.log($scope.localVideo.src);
                    }

                    console.log(stream);
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

        $scope.peerConnection = new RTCPeerConnection($scope.peerConnectionConfig);
        $scope.peerConnection.onicecandidate = gotIceCandidate;
        $scope.peerConnection.onaddstream = gotRemoteStream;
        //$scope.peerConnection.addStream($scope.localStream);
        $scope.localStream.getTracks().forEach( (track) => {
            $scope.peerConnection.addTrack(track, $scope.localStream);
        });

        if(isCaller) {
            $scope.peerConnection.createOffer(gotDescription, createOfferError);
        }
    }; // start
    
    
    $scope.leaveRoom = function(){
        $scope.send('leave_room');
        $state.go('lobby');
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
            element.css('background-color', list[i].color);
            $compile(element.contents())($scope);
        }
    };

    $scope.receivedTextMessage = function(message, color) {
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
        $scope.send('text_message', {
            message: $scope.message
        });
        $scope.message = '';
    }

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);
