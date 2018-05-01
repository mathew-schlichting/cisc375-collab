/**
 * Created by Mathew on 5/1/2018.
 */
function loginControllerFunction($scope, $state) {


    $scope.init = function(){
        console.log('login');
        

    };
    
    

    $scope.login = function(){
        if($scope.usernameFormat()) {
            $.get('/validUser/' + $scope.username, (data) => {
                if (data.valid) {
                    $state.go('lobby');
                }
                else {
                    alert('Username already taken!')
                }
            });
        }
        else{
            alert('Username must be alpha numeric!')
        }
    };


    $scope.usernameFormat = function(){
        //todo
        return true;
    }
    



}

collabApp.controller('loginCtrl', loginControllerFunction);
