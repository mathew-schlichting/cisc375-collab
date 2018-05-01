/**
 * Created by Mathew on 5/1/2018.
 */
function loginControllerFunction($scope, $state) {

    $scope.username = '';

    $scope.init = function(){
        console.log('login');




    };

    $scope.login = function(){
        if($scope.usernameFormat()) {
            $.get('/validUser/' + $scope.username, (data) => {
                if (data.valid) {

                }
                else {
                    alert('Username already taken!')
                }
                console.log(data);
            });
        }
    };


    $scope.usernameFormat = function(){
        //todo
        return true;
    }
    



}

collabApp.controller('loginCtrl', loginControllerFunction);
