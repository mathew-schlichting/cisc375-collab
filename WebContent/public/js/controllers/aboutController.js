function aboutControllerFunction($scope, $state, $compile) {

	$scope.init = function() {

        var element = $('#nav-section');
        element.html('<div class="btn btn-info" ng-click="toLogin();">Back to Login</div>');
        $compile(element.contents())($scope);
    } // init

    $scope.toLogin  = function() {
        $state.go('login');
    }

} // aboutControllerFunction

collabApp.controller('aboutCtrl', aboutControllerFunction);
