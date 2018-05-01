/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state, $rootScope) {


	$scope.init = function() {
		console.log('lobby');

		$scope.connection = new WebSocket('ws://' + window.location.hostname + ':8018');

        $scope.connection.onopen = (e) => {
            $scope.connection.send($scope.createMessage($scope.MESSAGE_TYPES.new_user, $rootScope.username, {}));
        };

		$scope.connection.onmessage = (message)=> {
			if(message.type === $scope.MESSAGE_TYPES.rooms_list){
				$scope.createRoomsList(message.data);
			}
			//todo
			console.log(message);
		};
	};

    $scope.loadRooms = function (rooms) {
        $('#roomsList').html(createRoomsList(rooms));
    };


    $scope.createRoomsList = function(rooms) {
        var html = '';
        for (var id in rooms) {
            html += createRoomTile(id);
        }
        html += '<li class="list-group-item"><button class="btn btn-success full-size" ng-click="createRoom()">Create Room</button></li>';
        return html;
    };

    $scope.createRoomTile = function(id){
        return  '<li id="' + id + '" class="list-group-item" ng-click="joinRoom(' + id + ');">'+
                    '<div class="row">'+
                        '<div class="col-sm-2">'+
                            'ID: ' + id +
                        '</div>'+
                        '<div class="col-sm-2">'+
                            'People 10/20'+
                        '</div>'+
                    '</div>'+
                '</li>';
    };

    $scope.joinRoom = function (id) {
        $state.go('room', {roomid: id});
    };

    $scope.createRoom = function (){
        var id = Math.floor(8999 * Math.random()) + 1111;
        $scope.joinRoom(id);
    };



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);