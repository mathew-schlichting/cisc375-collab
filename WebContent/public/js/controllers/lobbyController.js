/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state, $rootScope, $compile) {

    $scope.rooms = [];

	$scope.init = function() {

        if($rootScope.socket === undefined) {
            $rootScope.socket = io();
        }


		if (!$rootScope.socket.hasListeners('init_client')) {
			$rootScope.socket.on('init_client', (message) => {
				$scope.send('init_response', {
					color: $rootScope.color,
					id: message.data.id
				});
				$scope.makeLobbyCalls();
				$rootScope.initialized = true;
			});
		}

        if(!$rootScope.socket.hasListeners('rooms_list')) {
            $rootScope.socket.on('rooms_list', (message) => {
				$scope.rooms = [];
				console.log('loading rooms');
                $scope.loadRooms(message.data);
                $scope.$apply()
            });
        }

		if ($rootScope.initialized) {
			$scope.makeLobbyCalls();
		}

        $('#nav-section').html('');


	};

	$scope.makeLobbyCalls = function() {
		$scope.send('leave_room');
		$scope.send('request_rooms', {});
	};


    $scope.loadRooms = function (rooms) {
        for(var r in rooms){
            $scope.rooms.push({id: r, users: rooms[r].users});
        }
    };

	$scope.joinRoom = function(id) {
		$scope.send('join_room', {
			roomid: id
		});
		$state.go('room', {
			roomid: id
		});
	};

	$scope.createRoom = function() {
		var id = Math.floor(8888 * Math.random()) + 1111;

		$.get('/validRoom/' + id, (data) => {
			if (data.valid) {
				$scope.send('create_room', {
					roomid: id
				});
				$scope.joinRoom(id);
			} else {
				$scope.createRoom();
			}
		});
	};



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);
