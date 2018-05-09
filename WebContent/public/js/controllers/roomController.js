/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $state, $stateParams, $rootScope, $compile) {


    /* Information about the current room */
    $scope.roomid = '0001';
    $scope.meesage = '';
    $scope.users = {};


    /* video connections */
    $scope.localVideo = $('#localVideo')[0];
    $scope.remoteVideo = $('#remoteVideo')[0];
    $scope.localStream = null;


    // $scope.peerConnection = {};

    // New way to handle connections
    $scope.connections = [];
    $scope.remoteStreams = [];


    /* Constants to help build connections */
    $scope.constraints = {
        video: true,
    //    audio: true
        audio: false
    };

    $scope.offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    $scope.peerConnectionConfig = {
        'iceServers': [{
            'url': 'stun:stun.services.mozilla.com'
        },
            {
                'url': 'stun:stun.l.google.com:19302'
            }
        ]
    };


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
                $scope.receivedTextMessage(message.data.message, message.data.color);
            });
        }


        if (!$rootScope.socket.hasListeners('start_call')) {
            $rootScope.socket.on('start_call', (message) => {
                console.log("on start_call; $scope.localStream = " + $scope.localStream);
                if($scope.localStream !== null){
                    $scope.start(true, message.from);
                } /*else {
                    $scope.start(false, message.from);
                }*/
            });
        }

        var element = $('#nav-section');
        element.html('<div class="btn btn-danger" ng-click="leaveRoom();">Leave Room</div>');
        $compile(element.contents())($scope);


        if (!$rootScope.socket.hasListeners('rtc')) {
            $rootScope.socket.on('rtc', (message) => {
                if(message.from !== $rootScope.username) {
                    $scope.gotMessageFromServer(message);
                }
            });
        }
    }; // init


    $scope.setupStream = function(){
        $scope.loadLocalVideo();
    };

    $scope.closeStream = function(){
        if($scope.localStream !== null){
            $scope.localStream.getTracks().forEach(track => track.stop());
        }
    };


    $scope.loadLocalVideo = function(){
        // TODO - this is the part that we need to test to make sure that adapterjs is working correctly:
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia($scope.constraints).then(function(stream) {

                    var videoTracks = stream.getVideoTracks();
                    //for (var i = 0; i < videoTracks.length; i++) {
                    //    console.log(videoTracks[i]);
                    //}

                    // Success:
                    $scope.localStream = stream;
                    if ("srcObject" in $scope.localVideo) {
                        $scope.localVideo.srcObject = stream;
                    } else {
                        // Avoid using this in new browsers, as it is going away.
                        $scope.localVideo.src = window.URL.createObjectURL(stream);
                    }

                    $scope.send('start_call');
                    for(var i = 0; i < $scope.users.length; i++) {
                        console.log("Calling " + $scope.users[i].username);
                        $scope.start(false, $scope.users[i].username);
                    }
                })
                .catch(function(error) {
                    console.log(error);
                });
        } else {
            window.alert("Sorry; your browser does not support the getUserMedia API.");
        }
    };

    $scope.closeConnection = function(event){
        console.log('in on close');
        console.log(event);
    };


    $scope.start = (isCaller, username) => {
        //console.log("start: isCaller = " + isCaller + "; username = " + username);
        if($rootScope.username !== username) {
            var temp = new RTCPeerConnection($scope.peerConnectionConfig);
            temp.onicecandidate = $scope.gotIceCandidate;
            temp.onaddstream = $scope.gotRemoteStream;
            temp.oniceconnectionstatechange = $scope.closeConnection;
            $scope.localStream.getTracks().forEach( (track) => {
                temp.addTrack(track, $scope.localStream);
            });

            if(isCaller) {
                console.log('Is Caller');
                temp.createOffer($scope.gotDescription, $scope.createOfferError);
            }

            // Array format
            $scope.connections.push(temp);
            //object format
            //$scope.peerConnection[username] = temp;

        } // if - don't call ourself

    }; // start


    $scope.leaveRoom = function(){
        $scope.closeStream();
        $scope.send('leave_room');
        $state.go('lobby');
    };



    $scope.gotDescription = function(description, username) {
        console.log('got description');

        $scope.connections[$scope.connections.length -1].setLocalDescription(description, function() {
            $scope.send('rtc', {
                'sdp': description
            });
        }, function(){
            console.log('set description error')
        });

        /*
    	$scope.peerConnection[description.username].setLocalDescription(description, function() {
    		$scope.send('rtc', {
    			'sdp': description
    		});
    	}, function() {
    		console.log('set description error')
    	});*/
    };

    $scope.gotIceCandidate = function(event) {
    	if (event.candidate !== null) {
    		//console.log(event.candidate);
    		$scope.send('rtc', {
    			'ice': event.candidate
    		});
    	}
    };

    $scope.gotRemoteStream = function(event) {
    	console.log('got remote stream');
    	//console.log(event);
    	//$scope.remoteVideo.src = window.URL.createObjectURL(event.stream);

        var id = Math.floor(8888 * Math.random()) + 1111;
        var html =  '<dragDiv><video id="remoteVideo-' + id + '" autoplay height="100%" width="100%"></video></dragDiv>';

        var element = $('#videoContainer');
        element.html(element.html() + html);

        console.log($('#remoteVideo-' + id)[0]);
        //$('#remoteVideo-' + id)[0].src = window.URL.createObjectURL(event.stream);
        if ("srcObject" in $scope.remoteVideo) {
            $('#remoteVideo-' + id)[0].srcObject = event.stream;
        } else {
            // Avoid using this in new browsers, as it is going away.
            $('#remoteVideo-' + id)[0].src = window.URL.createObjectURL(event.stream);
            //console.log($scope.localVideo.src);
        }

    };

    $scope.refreshDraggable = function(){
        $('dragDiv').draggable();
    };

    $scope.createOfferError = function(error) {
    	console.log(error);
    };

    $scope.createAnswerError = function(error){
        console.log(error);
    };

    $scope.addIceCandidateError = function(error){
        console.log(error);
    };

    $scope.gotMessageFromServer = function(message) {
        var signal = message.data;
        if (signal.sdp) {
            $scope.connections[$scope.connections.length - 1].setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
                if (signal.sdp.type === 'offer') {
                    console.log('Creating Answer');
                    $scope.connections[$scope.connections.length - 1].createAnswer($scope.gotDescription, $scope.createAnswerError);
                }
            });
        } else if (signal.ice) {
            console.log('Adding Ice Candidate');
            $scope.connections[$scope.connections.length - 1].addIceCandidate(new RTCIceCandidate(signal.ice) /*, $scope.addIceCandidateError */);
        }


        /*
        if (signal.sdp) {
            $scope.peerConnection[message.from].setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
                if (signal.sdp.type === 'offer') {
                    console.log('Creating Answer');
                    $scope.peerConnection[message.from].createAnswer()
                    .then((description) => {
                        $scope.gotDescription(description, message.from);
                    })
                    .catch($scope.createAnswerError);
                }
            });
        } else if (signal.ice) {
            console.log('Adding Ice Candidate');
            $scope.peerConnection[message.from].addIceCandidate(new RTCIceCandidate(signal.ice));
        }
        */
    };







    /**********************   DONE   **************************************/
    $scope.receivedUserList = function(list) {
        $scope.users = list;
        console.log($scope.users);

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
