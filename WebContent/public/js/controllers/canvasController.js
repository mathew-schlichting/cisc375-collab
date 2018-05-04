function canvasControllerFunction($scope, $state, $rootScope, $compile) {

    $scope.paper        = null;
    $scope.context      = null;
    $scope.clickColor   = null;
    $scope.clickSize    = null;
    $scope.curTool      = null;
    $scope.clickX       = null;
    $scope.clickY       = null;
    $scope.clickDrag    = null;
    $scope.paint        = null;
    $scope.cursize      = null;
    $scope.curColor     = null;

    $scope.init = function(){
        $('.selectedColor').trigger('click');

        $scope.paper        = $('#drawing');
        $scope.context      = $scope.paper.getContext('2d');
        $scope.clickColor   = [];
        $scope.clickSize    = [];
        $scope.clickX       = [];
        $scope.clickY       = [];
        $scope.clickDrag    = [];


        // When the user clicks on the canvas:
        // 1. Record the position in an array via the addClick function,
        // 2. Set the boolean paint to true, and
        // 3. Update the canvas with the function redraw.
        $('#drawing').mousedown(function (e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            $scope.paint = true;
            $scope.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            $scope.redraw();
            $('body').css('cursor', 'default');
        });


        // Continue drawing on the canvas while the user is pressing down
        $('#drawing').mousemove(function (e) {
            if (paint) {
                $scope.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
                $scope.redraw();
                $('body').css('cursor', 'default');
            }
        });

        // When the user if no longer clicking on the canvas, stop drawing
        $('#drawing').mouseup(function (e) {$scope.paint = false;});

        // When the user leaves the canvas, stop drawing
        $('#drawing').mouseleave(function (e) {$scope.paint = false;});

        // Colors
        $('.color li').click(function () {
            $(this).siblings('li').removeClass('selectedColor');
            $(this).addClass('selectedColor');
            $scope.curColor = $(this).children('span').attr('rel');
        });

        // Tool size
        $('.size li').click(function () {
            $(this).siblings('li').removeClass('selectedColor');
            $(this).addClass('selectedColor');
            $scope.cursize = $(this).children('span').attr('rel');
        });

        $("#erasecanvas").click(function () {$scope.curTool = "eraser";});
        $("#pencanvas").click(function () {$scope.curTool = "";});

        // Clear the canvas
        $('#clearcanvas').click(function () {context.clearRect(0, 0, paper.width, paper.height);});
    };

    $scope.addClick = function(c, y, dragging){
        $scope.clickX.push(x);
        $scope.clickY.push(y);
        $scope.clickDrag.push(dragging);

        if ($scope.curTool === "eraser") {
            $scope.clickColor.push("white");
        } else {
            $scope.clickColor.push($scope.curColor);
        }

        $scope.clickSize.push($scope.cursize);
    };

        // Each time this function is called, the canvas records/draws the new marks
    $scope.redraw = function () {
        $scope.context.save();
        $scope.context.beginPath();
        $scope.context.rect(0, 0, $scope.context.canvas.width, $scope.context.canvas.height);
        $scope.context.clip();

        $scope.context.lineJoin = "round";

        for (var i = 0; i < $scope.clickX.length; i++) {
            $scope.context.beginPath();
            if ($scope.clickDrag[i] && i) {
                $scope.context.moveTo($scope.clickX[i - 1], $scope.clickY[i - 1]);
            } else {
                $scope.context.moveTo($scope.clickX[i] - 1, $scope.clickY[i]);
            }
            $scope.context.lineTo($scope.clickX[i], $scope.clickY[i]);
            $scope.context.closePath();
            $scope.context.strokeStyle = $scope.clickColor[i];
            $scope.context.lineWidth = parseInt($scope.clickSize[i]);
            $scope.context.stroke();
        }

        $scope.context.restore();
    };
};

collabApp.controller('canvasCtrl', canvasControllerFunction);