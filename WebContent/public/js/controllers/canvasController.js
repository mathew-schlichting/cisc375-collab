function canvasControllerFunction($scope, $state, $rootScope, $compile) {

    $scope.paper = null;
    $scope.context = null;
    $scope.clickColor   = [];
    $scope.clickSize    = [];
    $scope.curTool      = 'pen';
    $scope.clickX       = [];
    $scope.clickY       = [];
    $scope.clickDrag    = [];
    $scope.paint        = false;
    $scope.cursize      = 2;
    $scope.curColor     = 'white';

    $scope.red = 0;
    $scope.green = 0;
    $scope.blue = 0;

    $scope.canvasLeft   = 0;
    $scope.canvasTop    = 0;

    $scope.colors = [
        '#cb3594',
        '#FF0000',
        '#659b41',
        '#ffcf33'
    ];

    $scope.init = function(){
        $('.selectedColor').trigger('click');

        $scope.paper        = $('#drawing')[0];
        $scope.context      = $scope.paper.getContext('2d');
        $scope.curColor     = $scope.colors[0];

        var rect = $scope.paper.getBoundingClientRect();
        $scope.canvasLeft   = rect.left;
        $scope.canvasTop    = rect.top;


        // adds watches to colors to update paint brush
        $scope.$watch('red', function () {$scope.updateColorSample();});
        $scope.$watch('green', function () {$scope.updateColorSample();});
        $scope.$watch('blue', function () {$scope.updateColorSample();});
    };

    // credit to https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    // clever way to convert rgb values into the hex color
    $scope.updateColorSample = function(){

        if($scope.curTool === 'eraser'){
            $scope.red = 255;
            $scope.green = 255;
            $scope.blue = 255;
            $($scope.paper).css('cursor', 'url(\'images/eraser.png\'), auto')
        }
        else{
            $($scope.paper).css('cursor', 'url(\'images/pen.png\'), auto')
        }

        $('#colorSample').css('background-color', 'rgb('+$scope.red+','+$scope.green+','+$scope.blue+')');
        $scope.curColor = '#' + ((1 << 24) + ($scope.red << 16) + ($scope.green << 8) + $scope.blue).toString(16).slice(1);
    };

    $scope.startDrawing = function(e){
        $scope.paint = true;
        $scope.addClick(e.clientX - $scope.canvasLeft, e.clientY - $scope.canvasTop, false);
        $scope.redraw();
        $('body').css('cursor', 'default');
    };

    $scope.drawMore = function(e) {
        if ($scope.paint) {
            $scope.addClick(e.clientX - $scope.canvasLeft, e.clientY - $scope.canvasTop, true);
            $scope.redraw();
            $('body').css('cursor', 'default');
        }
    };

    $scope.addClick = function(x, y, dragging){
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

    $scope.stopDrawing = function (){
        $scope.paint = false;
    };


    $scope.changeColor = function(event, c){
        $(event.currentTarget.parentElement.children).removeClass('selectedColor');
        $(event.currentTarget).addClass('selectedColor');
        $scope.curColor = $scope.colors[c];
    };

    $scope.clearCanvas = function(){
        $scope.context.clearRect(0, 0, $scope.paper.width, $scope.paper.height);
        $scope.clickX     = [];
        $scope.clickY     = [];
        $scope.clickDrag  = [];
        $scope.clickColor = [];
        $scope.clickSize  = [];
    };

    $scope.toPen = function(){
        var erase = $('#erasecanvas');
        var pen = $('#pencanvas');
        erase.removeClass('btn-info');
        erase.addClass('btn-default');
        pen.removeClass('btn-default');
        pen.addClass('btn-info');

        $scope.curTool = 'pen';

        $scope.red = 0;
        $scope.green = 0;
        $scope.blue = 0;
    };

    $scope.toEraser = function (){
        var erase = $('#erasecanvas');
        var pen = $('#pencanvas');
        pen.removeClass('btn-info');
        pen.addClass('btn-default');
        erase.removeClass('btn-default');
        erase.addClass('btn-info');

        $scope.curTool = 'eraser';

        $scope.red = 255;
        $scope.green = 255;
        $scope.blue = 255;
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