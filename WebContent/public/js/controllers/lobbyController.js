/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state, $rootScope, $compile) {


	$scope.init = function() {
		console.log('lobby');

		$rootScope.connection = new WebSocket('ws://' + window.location.hostname + ':8018');

        $rootScope.connection.onopen = (e) => {
            $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.new_user, $rootScope.username));
            $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.ask_for_rooms, $rootScope.username));
            $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.leave_room, $rootScope.username));
        };

		$rootScope.connection.onmessage = (event)=> {
		    var data = JSON.parse(event.data);

            if(data.type === $scope.MESSAGE_TYPES.rooms_list){
                console.log('loading rooms');
                $scope.loadRooms(data.data);
			}

			console.log(data);
			//todo
		};

    };

    $scope.loadRooms = function (rooms) {
        var element = $('#roomsList');
        element.html($scope.createRoomsList(rooms));
        $compile(element.contents())($scope);
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
        return  '<li id="' + id + '" class="list-group-item" ng-click="joinRoom(' + id + ');">'+
                    '<div class="row">'+
                        '<div class="col-sm-2">'+
                            'ID: ' + id +
                        '</div>'+
                        '<div class="col-sm-2">'+
                            'People: ' + room.users +
                        '</div>'+
                    '</div>'+
                '</li>';
    };

    $scope.joinRoom = function (id) {
        $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.join_room, $rootScope.username, id));
        $state.go('room', {roomid: id});
    };

    $scope.createRoom = function (){
        var id = Math.floor(8999 * Math.random()) + 1111;

        $.get('/validRoom/' + id, (data) =>{
            if(data.valid){
                $rootScope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.create_room, $rootScope.username, id));
                $scope.joinRoom(id);
            }
            else{
                $scope.createRoom();
            }
        });
    };



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);