/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state, $rootScope) {

    $scope.rooms = [];

	$scope.init = function() {
		$rootScope.prevPage = 'lobby';

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
				for(var r in message.data){
					$scope.rooms.push({id: r, users: message.data[r].users});
				}
                $scope.$apply()

            });
        }

		if ($rootScope.initialized) {
			$scope.makeLobbyCalls();
		}

        $('#nav-section').html('');
	};

	$scope.makeLobbyCalls = function() {
		$scope.send('request_rooms', {});
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
				console.log("joined room");
			} else {
				$scope.createRoom();
				console.log("created room");
			}
		});
	};



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);
