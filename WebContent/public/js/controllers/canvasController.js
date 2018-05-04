function canvasControllerFunction($scope, $state, $rootScope, $compile) {
    window.onload = function () {
        $('.selectedColor').trigger('click');
    }

    $(function () {
        paper = document.getElementById('drawing')
        context = paper.getContext("2d");

        // When the user clicks on the canvas:
        // 1. Record the position in an array via the addClick function,
        // 2. Set the boolean paint to true, and
        // 3. Update the canvas with the function redraw.
        $('#drawing').mousedown(function (e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            paint = true;
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            redraw();
            $('body').css('cursor', 'default');
        });

        // Continue drawing on the canvas while the user is pressing down
        $('#drawing').mousemove(function (e) {
            if (paint) {
                addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
                redraw();
                $('body').css('cursor', 'default');
            }
        });

        // When the user if no longer clicking on the canvas, stop drawing
        $('#drawing').mouseup(function (e) {
            paint = false;
        });

        // When the user leaves the canvas, stop drawing
        $('#drawing').mouseleave(function (e) {
            paint = false;
        });

        // Colors
        var curColor;
        $('.color li').click(function () {
            $(this).siblings('li').removeClass('selectedColor');
            $(this).addClass('selectedColor');
            curColor = $(this).children('span').attr('rel');
        });

        // Tool size
        var cursize;
        $('.size li').click(function () {
            $(this).siblings('li').removeClass('selectedColor');
            $(this).addClass('selectedColor');
            cursize = $(this).children('span').attr('rel');
        });

        var clickColor = new Array();

        var clickSize = new Array();

        // Tools
        var curTool;
        $("#erasecanvas").click(function () {
            curTool = "eraser";
        });
        $("#pencanvas").click(function () {
            curTool = "";
        });

        // Saves the clicked/draw location
        var clickX = new Array();
        var clickY = new Array();
        var clickDrag = new Array();
        var paint;

        function addClick(x, y, dragging) {
            clickX.push(x);
            clickY.push(y);
            clickDrag.push(dragging);

            if (curTool === "eraser") {
                clickColor.push("white");
            } else {
                clickColor.push(curColor);
            }

            clickSize.push(cursize);
        }

        // Each time this function is called, the canvas records/draws the new marks
        function redraw() {
            context.save();
            context.beginPath();
            context.rect(0, 0, context.canvas.width, context.canvas.height);
            context.clip();

            context.lineJoin = "round";

            for (var i = 0; i < clickX.length; i++) {
                context.beginPath();
                if (clickDrag[i] && i) {
                    context.moveTo(clickX[i - 1], clickY[i - 1]);
                } else {
                    context.moveTo(clickX[i] - 1, clickY[i]);
                }
                context.lineTo(clickX[i], clickY[i]);
                context.closePath();
                context.strokeStyle = clickColor[i];
                context.lineWidth = parseInt(clickSize[i]);
                context.stroke();
            }
            context.restore();
        }

        // Clear the canvas
        $('#clearcanvas').click(function () {
            context.clearRect(0, 0, paper.width, paper.height);
        });
    });
});

collabApp.controller('roomCtrl', canvasControllerFunction);