/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $state, $stateParams, $rootScope, $compile) {

    /* Information about the current room */
    $scope.roomid = '0000';
    $scope.meesage = '';
    $scope.users = {};


    /* video connections */
    $scope.localVideo = $('#localVideo')[0];
    $scope.localStream = null;
    $scope.remoteStreams = [];
    $scope.peerConnection = {};

    /* Constants to help build connections */
    $scope.constraints = {
        video: true,
        //audio: true
        audio: false
    };

    $scope.offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };



    // We'll want to use adapterjs to avoid the following lines:
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

    $scope.init = function() {
        $rootScope.prevPage = 'room';

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
                if($scope.localStream !== null){
                    $scope.start(true, message.from);
                }
            });
        }

        if (!$rootScope.socket.hasListeners('stop_streaming')) {
            $rootScope.socket.on('stop_streaming', (message) => {
                if($scope.localStream !== null && $rootScope.username !== message.from){
                    $scope.closeUserStream(message.from);
                }
            });
        }


        var element = $('#nav-section');
        element.html('<div class="btn btn-danger" ng-click="leaveRoom();">Leave Room</div>');
        $compile(element.contents())($scope);


        if (!$rootScope.socket.hasListeners('rtc')) {
            $rootScope.socket.on('rtc', (message) => {
                if(message.from !== $rootScope.username && $scope.localStream !== null){
                    $scope.gotMessageFromServer(message);
                }
            });
        }
    }; // init


    $scope.closeUserStream = function (username) {
        console.log('Trying to close user stream...');
        $('#remoteVideo-' + username)[0].srcObject = undefined;
    };

    $scope.setupStream = function(){
        $scope.loadLocalVideo();
    };

    $scope.closeStream = function(){
        if($scope.localStream !== null){
            var element;

            $scope.localStream.getTracks().forEach(track => track.stop());
            $scope.send('stop_streaming');

            $scope.localVideo.srcObject = undefined;

            for(var user in $scope.users){
                if($scope.users[user].username !== $rootScope.username){
                    element = $('#remoteVideo-' + $scope.users[user].username)[0];
                    if(element) {
                        element.srcObject = undefined;
                    }
                }
            }
        }
    };

    $scope.getLocalVideoStream = function(success, error){
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia($scope.constraints).then(success).catch(error);
        } else {
            window.alert("Sorry; your browser does not support the getUserMedia API.");
        }
    };


    $scope.loadLocalVideo = function(){
        $scope.getLocalVideoStream((stream) => {
            $scope.localStream = stream;
            if ('srcObject' in $scope.localVideo) {
                $scope.localVideo.srcObject = stream;
            } else {
                $scope.localVideo.src = window.URL.createObjectURL(stream);
            }


            $scope.send('start_streaming', {id: $scope.localStream.id});
            for(var i=0;i<$scope.users.length;i++){
                $scope.start(false, $scope.users[i].username);
            }
            $scope.send('start_call');
            

        }, (error) => {
            console.log('Load local video error: ', error);
        });
    };


    $scope.start = (isCaller, username) => {
        if($rootScope.username !== username) {
            var temp;

            temp = new RTCPeerConnection();
            temp.onicecandidate = $scope.gotIceCandidate;
            temp.onaddstream = $scope.gotRemoteStream;
            $scope.localStream.getTracks().forEach( (track) => {
                temp.addTrack(track, $scope.localStream);
            });

            if(isCaller) {
                console.log('Is Caller');
                temp.createOffer()
                    .then((offer) => {
                        $scope.gotDescription(offer, username);
                    })
                    .catch((error) => {
                        $scope.createOfferError(error);
                    });
            }

            $scope.peerConnection[username] = temp;
        } // if - don't call ourself
    }; // start


    $scope.leaveRoom = function(){
        $scope.closeStream();
        $scope.send('leave_room');
        $state.go('lobby');
    };

    $scope.gotDescription = function(description, username) {
        $scope.peerConnection[username].setLocalDescription(description, function() {
            $scope.send('rtc', {
                'sdp': description
            });
        }, function(error){
            console.log('Set description error: ', error);
        });
    };

    $scope.gotIceCandidate = function(event) {
    	if (event.candidate !== null) {
    		$scope.send('rtc', {
    			'ice': event.candidate
    		});
    	}
    };

    $scope.gotRemoteStream = function(event) {
        for(user in $scope.users){
            if($scope.users[user].streamid === event.stream.id){
                console.log('Received Stream From: ', $scope.users[user].username);
                var id = $scope.users[user].username;
            }
        }

        var remoteVideo = document.getElementById('remoteVideo-' + id);

        if(remoteVideo === null) {
            //add element to video container
            var html = '<div class="col-md-2"><div class="margin-xs"><video id="remoteVideo-' + id + '" autoplay height="100%" width="100%"></video></div></div>';
            $('#videoContainer').append(html);
            remoteVideo = $('#remoteVideo-' + id)[0];
        }

        // add video stream to new element
        $scope.remoteStreams.push(event.stream);

        console.log(event.stream);

        if ('srcObject' in remoteVideo) {
            remoteVideo.srcObject = event.stream;
        } else {
            remoteVideo.src = window.URL.createObjectURL(event.stream);
        }

    };


    $scope.createOfferError = function(error) {
    	console.log('Create offer error: ', error);
    };

    $scope.createAnswerError = function(error){
        console.log('Create answer error: ', error);
    };

    $scope.gotMessageFromServer = function(message) {
        var signal = message.data;

        if (signal.sdp) {
            $scope.sdpConnection(signal.sdp, message.from);
        } else if (signal.ice) {
            if( $scope.peerConnection[message.from].iceConnectionState === 'new') {
                    $scope.peerConnection[message.from].addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        }
    };

    $scope.sdpConnection = function (sdp, user){
        if($scope.peerConnection[user].remoteDescription.type === '') {
            $scope.peerConnection[user].setRemoteDescription(new RTCSessionDescription(sdp), function () {
                if (sdp.type === 'offer') {
                    $scope.peerConnection[user].createAnswer()
                        .then((answer) => {
                            $scope.gotDescription(answer, user);
                        })
                        .catch((error) => {
                            $scope.createAnswerError(error);
                        });
                }
            });
        }
    };







    /**********************   DONE   **************************************/
    $scope.receivedUserList = function(list) {
        $scope.users = list;

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
        element.append('<li class="list-group-item message"><div id="temp-color" class="user-color"></div><div class="pull-right" style="height: auto;">' + message + '</div></li>');
        $compile(element.contents())($scope);

        element = $('#temp-color');
        element.css('border-radius', '50%');
        element.css('background-color', color);
        element.attr('id', '');
        $compile(element.contents())($scope);
    };

    $scope.messageKeyup = function(event){
        if(event.keyCode === 13){
            $scope.sendMessage();
        }
    };

    $scope.sendMessage = function() {
        $scope.send('text_message', {
            message: $scope.message
        });
        $scope.message = '';
    }

} // roomControllerFunction

collabApp.controller('roomCtrl', roomControllerFunction);
