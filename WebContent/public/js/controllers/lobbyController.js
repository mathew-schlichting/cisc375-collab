/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state, $rootScope, $compile) {

    $scope.rooms = [];//[{id: 'boi', users: ['test']}];

	$scope.init = function() {

		if($rootScope.socket === undefined) {
            $rootScope.socket = io();
        }


		if(!$rootScope.socket.hasListeners('init_client')) {
            $rootScope.socket.on('init_client', (message) => {
                $scope.send('init_response', {color: $rootScope.color, id: message.data.id});
                $scope.makeLobbyCalls();
                $rootScope.initialized = true;
            });
        }

        if(!$rootScope.socket.hasListeners('rooms_list')) {
            $rootScope.socket.on('rooms_list', (message) => {
                console.log('loading rooms');
                $scope.loadRooms(message.data);
            });
        }

        if($rootScope.initialized){
            $scope.makeLobbyCalls();
        }
    };

    $scope.makeLobbyCalls = function(){
        $scope.send('leave_room');
        $scope.send('request_rooms');
    };


    $scope.loadRooms = function (rooms) {
        $scope.rooms = [];
        for(r in rooms){
            $scope.rooms.push({id: r, users: rooms[r].users});
        }
        
        console.log($scope.rooms);


        //var element = $('#roomsList');
        //element.html($scope.createRoomsList(rooms));
        //$compile(element.contents())($scope);
    };

    $scope.createRooms = function(rooms) {
        console.log(rooms);
        return rooms;
    };

    $scope.createRoomsList = function(rooms) {
        var html = '';
        for (var id in rooms) {
            html += $scope.createRoomTile(id, rooms[id]);
        }
        html += '<li class="list-group-item"><button class="btn btn-success full-size" ng-click="createRoom()">Create Room</button></li>';
        return html;
    };

    $scope.createRoomTile = function(id, room){
        return  '<li id="' + id + '" class="list-group-item" ng-click="joinRoom(' + id + ');"><div class="row"><div class="col-sm-2">ID: ' + id + '</div><div class="col-sm-10">People: ' + room.users + '</div></div></li>';
    };

    $scope.joinRoom = function (id) {
        $scope.send('join_room', {roomid: id});
        $state.go('room', {roomid: id});
    };

    $scope.createRoom = function (){
        var id = Math.floor(8999 * Math.random()) + 1111;

        $.get('/validRoom/' + id, (data) =>{
            if(data.valid){
                $scope.send('create_room', {roomid: id});
                $scope.joinRoom(id);
            }
            else{
                $scope.createRoom();
            }
        });
    };



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);