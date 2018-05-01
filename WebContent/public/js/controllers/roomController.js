/**
 * Created by Mathew on 4/30/2018.
 */
function roomControllerFunction($scope, $stateParams) {

    $scope.roomid = '0001';
    $scope.connection = null;
    $scope.meesage = '';


    $scope.init = function(){
        console.log('room');

        $scope.roomid = $stateParams.roomid;

        $scope.connection = new WebSocket('ws://' + window.location.hostname + ':8018');

        $scope.connection.onopen = (event) => {
            console.log('on open');
            $scope.connection.send("something");
        };
        $scope.connection.onmessage = (message)=> {
              console.log(message);
        };



    };



    $scope.sendMessage = function(){
        $scope.connection.send("something");

    }



}

collabApp.controller('roomCtrl', roomControllerFunction);
