/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $state, $stateParams, $rootScope, $compile) {

    //credit to https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
    String.prototype.hashCode = function() {
        var hash = 0;
        if (this.length == 0) {
            return hash;
        }
        for (var i = 0; i < this.length; i++) {
            var char = this.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

    /* Information about the current room */
    $scope.roomid = '0001';
    $scope.meesage = '';
    $scope.users = {};


    /* video connections */
    $scope.localVideo = $('#localVideo')[0];
    $scope.localStream = null;

    
    $scope.peerConnection = {};

    // New way to handle connections
    $scope.connections = [];
    $scope.remoteStreams = [];
    $scope.userStreamIds = [];


    /* Constants to help build connections */
    $scope.constraints = {
        video: true,
        audio: true
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
                $scope.userStreamIds.push({username: message.from, id: message.data.id});

                if($scope.localStream !== null){
                    $scope.start(true, message.from);
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
                    if ('srcObject' in $scope.localVideo) {
                        $scope.localVideo.srcObject = stream;
                    } else {
                        // Avoid using this in new browsers, as it is going away.
                        $scope.localVideo.src = window.URL.createObjectURL(stream);
                    }

                    $scope.send('start_call', {id: $scope.localStream.id});
                    for(var i = 0; i < $scope.users.length; i++) {
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

    $scope.stateChange = function(event){
        console.log('in stateChange');
        //todo
        //for(var i=0; i<$scope.connections.length; i++){
        //    if($scope.connections[i].iceConnectionState === 'completed'){
        //        console.log('Closed connection with:', i);
        //    }
        //}
    };


    $scope.start = (isCaller, username) => {
        if($rootScope.username !== username) {
            var temp = new RTCPeerConnection($scope.peerConnectionConfig);
            temp.onicecandidate = $scope.gotIceCandidate;
            temp.onaddstream = $scope.gotRemoteStream;
            temp.oniceconnectionstatechange = $scope.stateChange;
            $scope.localStream.getTracks().forEach( (track) => {
                temp.addTrack(track, $scope.localStream);
            });

            var streamID = '';

            if(isCaller) {
                console.log('Is Caller');
                streamID = $scope.userStreamIds[username];
                temp.createOffer($scope.gotDescription, $scope.createOfferError);
            }

            //$scope.connections.push({peer: temp, id: streamID, username: username});
            $scope.peerConnection[username] = {peer: temp, id: streamID};

            console.log($scope.peerConnection);

        } // if - don't call ourself
    }; // start


    $scope.leaveRoom = function(){
        $scope.closeStream();
        $scope.send('leave_room');
        $state.go('lobby');
    };

    $scope.getIdFromDescription = function(description){
        //console.log($scope.userStreamIds);
        
        var format = '0123456789abcdefghijklmnopqrstuvwxyz';
        var sdp = description.sdp;
        var wmsLoc = sdp.indexOf('WMS');
        var keyLoc = wmsLoc + 4;
        return sdp.substring(keyLoc, keyLoc + format.length);
    };

    $scope.getFingerPrintFromDescription = function(description){
        var sdp = description.sdp;
        var fingerPrintLoc = sdp.indexOf('fingerprint');
        var keyLoc = fingerPrintLoc + 20;
        var key = sdp.substring(keyLoc, keyLoc + 95);
        console.log(key);
    };

    $scope.gotDescription = function(description) {
        $scope.getFingerPrintFromDescription(description);
        //$scope.connections[$scope.connections.length - 1].peer.setLocalDescription(description, function() {
        //    $scope.send('rtc', {
        //        'sdp': description
        //    });
        //}, function(){
        //    console.log('set description error')
        //});
        //console.log('user list');
        //console.log($scope.userStreamIds);
        //console.log($scope.getIdFromDescription(description));

        console.log(description);

        for(var user in $scope.peerConnection){
            if($scope.peerConnection[user].peer.localDescription !== undefined){
                $scope.peerConnection[user].peer.setLocalDescription(description, function() {
                    $scope.send('rtc', {
                        'sdp': description
                    });
                }, function(error){
                    console.log('set description error');
                    console.log(error);
                });
            }
        }

    };

    $scope.gotIceCandidate = function(event) {
    	if (event.candidate !== null) {
    		$scope.send('rtc', {
    			'ice': event.candidate
    		});
    	}
    };

    $scope.gotRemoteStream = function(event) {
        var id = $scope.getIdFromDescription(event.target.remoteDescription);
        
        console.log('Got stream: ', id);
        
        var html =  '<div class="col-md-2"><div class="margin-xs"><video id="remoteVideo-' + id + '" autoplay height="100%" width="100%"></video></div></div>';

        //add element to video container
        var element = $('#videoContainer');
        element.append(html);
        
        // add video stream to new element
        element = $('#remoteVideo-' + id)[0];
        $scope.remoteStreams.push(element);

        if ('srcObject' in element) {
            console.log('test');
            element.srcObject = event.stream;
        } else {
            // Avoid using this in new browsers, as it is going away.
            element.src = window.URL.createObjectURL(event.stream);
        }
    };


    $scope.createOfferError = function(error) {
    	console.log(error);
    };

    $scope.createAnswerError = function(error){
        console.log(error);
    };

    $scope.gotMessageFromServer = function(message) {
        var signal = message.data;

        
        if (signal.sdp) {
            $scope.peerConnection[message.from].peer.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
                if (signal.sdp.type === 'offer') {
                    $scope.peerConnection[message.from].peer.createAnswer($scope.gotDescription, $scope.createAnswerError);
                }
            });
        } else if (signal.ice) {
            $scope.peerConnection[message.from].peer.addIceCandidate(new RTCIceCandidate(signal.ice));
        }
        
            

        /*
        if (signal.sdp) {
            $scope.connections[$scope.connections.length - 1].peer.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
                if (signal.sdp.type === 'offer') {
                    $scope.connections[$scope.connections.length - 1].peer.createAnswer($scope.gotDescription, $scope.createAnswerError);
                }
            });
        } else if (signal.ice) {
            $scope.connections[$scope.connections.length - 1].peer.addIceCandidate(new RTCIceCandidate(signal.ice));
        }
        */
        
        
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
