/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $state, $stateParams, $rootScope, $compile) {

    $scope.roomid = '0001';
    $scope.meesage = '';

    $scope.localVideo = $('#localVideo')[0];
    $scope.remoteVideo = $('#remoteVideo')[0];
    $scope.localStream = null;
    $scope.peerConnection = null;
    $scope.peerConnectionConfig = {
        'iceServers': [{
                'url': 'stun:stun.services.mozilla.com'
            },
            {
                'url': 'stun:stun.l.google.com:19302'
            }
        ]
    };
    $scope.serverConnection = null;

    $scope.connections = [];
    
    
    $scope.constraints = {
        video: true,
        audio: true
    };

    $scope.offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };




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



        // todo double check we need this
        if (!$rootScope.socket.hasListeners('start_call')) {
            $rootScope.socket.on('start_call', (message) => {
                if(message.from !== $rootScope.username){
                    $scope.start(true);
                }
            });
        }



        
        var element = $('#nav-section');
        element.html('<div class="btn btn-danger" ng-click="leaveRoom();">Leave Room</div>');
        $compile(element.contents())($scope);



        //$scope.serverConnection = new WebSocket('ws://' + window.location.hostname + ':8018');
        // TODO - the following line will change drastically with socket.io:
        //$s.serverConnection.onmessage = gotMessageFromServer; // TODO - rename this when actually connected
        //var socket = io('http://localhost:8018');
        //$rootsocket.on('connection', function (data) {
        //    console.log(data);
        //    socket.emit('my other event', { my: 'data' });
        //});
        if (!$rootScope.socket.hasListeners('rtc')) {
            $rootScope.socket.on('rtc', (message) => {
                if(message.from !== $rootScope.username) {
                    $scope.gotMessageFromServer(message);
                }
            });
        }
        
        $scope.loadLocalVideo();



        /*********************** Attempts to display video of ourselves ******************/
        

        //console.log(navigator);

        
    }; // init


    $scope.setupStream = function(){
        $scope.loadLocalVideo();
    };

    $scope.closeStream = function(){
        $scope.localStream.getTracks().forEach(track => track.stop());
    };


    $scope.loadLocalVideo = function(){
        // TODO - this is the part that we need to test to make sure that adapterjs is working correctly:
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia($scope.constraints).then(function(stream) {

                    var videoTracks = stream.getVideoTracks();
                    for (var i = 0; i < videoTracks.length; i++) {
                        console.log(videoTracks[i]);
                    }

                    // Success:
                    $scope.localStream = stream;
                    //console.log($scope.localStream);
                    // Older browsers may not have srcObject
                    //console.log($scope.localVideo);
                    if ("srcObject" in $scope.localVideo) {
                        $scope.localVideo.srcObject = stream;
                    } else {
                        // Avoid using this in new browsers, as it is going away.
                        $scope.localVideo.src = window.URL.createObjectURL(stream);
                        //console.log($scope.localVideo.src);
                    }
                    
                    //console.log(stream);
                    //$scope.localVideo.src = window.URL.createObjectURL(stream);


                    $scope.send('start_call');
                    $scope.start(false);
                })
                .catch(function(error) {
                    console.log(error);
                });
        } else {
            window.alert("Sorry; your browser does not support the getUserMedia API.");
        }
    };
    
    

    $scope.start = (isCaller) => {
        console.log("start functionality coming soon!");

        $scope.peerConnection = new RTCPeerConnection($scope.peerConnectionConfig);
        $scope.peerConnection.onicecandidate = $scope.gotIceCandidate;
        $scope.peerConnection.onaddstream = $scope.gotRemoteStream;
        $scope.localStream.getTracks().forEach( (track) => {
            $scope.peerConnection.addTrack(track, $scope.localStream);
        });

        if(isCaller) {
            console.log('Is Caller');
            $scope.peerConnection.createOffer($scope.gotDescription, $scope.createOfferError);
        }
    }; // start
    
    
    $scope.leaveRoom = function(){
        $scope.closeStream();
        $scope.send('leave_room');
        $state.go('lobby');
    };
    


    $scope.gotDescription = function(description) {
    	console.log('got description');
    	$scope.peerConnection.setLocalDescription(description, function() {
    		$scope.send('rtc', {
    			'sdp': description
    		});
    	}, function() {
    		console.log('set description error')
    	});
    };

    $scope.gotIceCandidate = function(event) {
    	if (event.candidate != null) {
    		console.log(event.candidate);
    		$scope.send('rtc', {
    			'ice': event.candidate
    		});
    	}
    };

    $scope.gotRemoteStream = function(event) {
    	console.log('got remote stream');
    	console.log(event);
    	$scope.remoteVideo.src = window.URL.createObjectURL(event.stream);
    	console.log($scope.remoteVideo);
    };

    $scope.createOfferError = function(error) {
    	console.log(error);
    };

    $scope.createAnswerError = function(error){
        console.log(error);
    };

    $scope.gotMessageFromServer = function(message) {
        if ($scope.peerConnection === null) {
            $scope.start(true);
        }
        else {
            var signal = message.data;
            if (signal.sdp) {
                $scope.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
                    if (signal.sdp.type == 'offer') {
                        console.log('Creating Answer');
                        $scope.peerConnection.createAnswer($scope.gotDescription, $scope.createAnswerError);
                    }
                });
            } else if (signal.ice) {
                console.log('Adding Ice Candidate');
                $scope.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        }
    };



    
    
    
    
    /**********************   DONE   **************************************/
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
    
    $scope.sendMessage = function() {
        $scope.send('text_message', {
            message: $scope.message
        });
        $scope.message = '';
    }

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);
