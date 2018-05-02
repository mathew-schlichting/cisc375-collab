/**
 * Created by Mathew on 5/1/2018.
 */
function loginControllerFunction($scope, $state, $rootScope) {


    $scope.loginName = '';

    $scope.init = function(){
        console.log('login');
        

    };
    
    

    $scope.login = function(){
        if($scope.usernameFormat()) {
            $.get('/validUser/' + $scope.loginName, (data) => {
                if (data.valid) {
                    $rootScope.username = $scope.loginName;
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
