/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state) {


    $scope.init = function(){
        console.log('lobby');


    };

    $scope.joinRoom = function (id) {
        $state.go('room', {roomid: id});
    };

    $scope.createRoom = function (){
        console.log('in here');
        var id = Math.floor(8999 * Math.random()) + 1111;
        $scope.joinRoom(id);
    };



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);
