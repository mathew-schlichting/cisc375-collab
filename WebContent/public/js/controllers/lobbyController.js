/**
 * Created by Mathew on 4/30/2018.
 */
function lobbyControllerFunction($scope, $state) {


    $scope.init = function(){
        console.log('lobby');


    };



    $scope.createRoom = function (){
        console.log('in here');
        var id = Math.floor(8999 * Math.random()) + 1111;
        $state.go('room', {roomid: id});
    };



}

collabApp.controller('lobbyCtrl', lobbyControllerFunction);
