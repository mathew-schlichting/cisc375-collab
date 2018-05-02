/**
 * Created by Mathew on 5/1/2018.
 */
function loginControllerFunction($scope, $state, $rootScope) {


    $scope.loginName = '';
    $scope.loginColor = 'black';


    $scope.init = function(){
        console.log('login');
        

    };
    
    

    $scope.login = function(){
        if($scope.usernameFormat($scope.loginName)) {
            $.get('/validUser/' + $scope.loginName, (data) => {
                if (data.valid) {
                    $rootScope.username = $scope.loginName;
                    $rootScope.color = $scope.loginColor;
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


    $scope.usernameFormat = function(s){
        return $scope.isAlphaNumeric(s);
    };


    $scope.isAlphaNumeric = function (s) {
        var code, i;

        for (i = 0; i < s.length; i++) {
            code = s.charCodeAt(i);
            if (!(code > 47 && code < 58) && !(code > 64 && code < 91) && !(code > 96 && code < 123) && code !== 45 && code !== 95) {
                return false;
            }
        }
        return true;
    };
    



}

collabApp.controller('loginCtrl', loginControllerFunction);
