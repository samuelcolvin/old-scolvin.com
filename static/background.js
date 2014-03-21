"use strict";

function draw_random(){
    var width = $(window).width()
    if (width < 500)
        return;
    var animate = false;
	var canvas = $('#canvas_background');
	var ctx = canvas[0].getContext('2d');
	width = width + 20;
	var height = $(window).height();
	canvas.width(width);
	ctx.canvas.width = width;
	canvas.height(height);
	ctx.canvas.height = height;
	ctx.clearRect(0, 0, width, height);
	var config = {};
	config.box = 10;
	config.back = 255;
	config.min_color = 60;
	config.radius = 0;
	config.border = 1;
	config.start_min = 170;
	config.start_max = 245;
	config.fade_steps = [1, 1.4, 2, 4, 7, 11, 20];
	config.step_range = [1, 4];
	config.start_interval = 50;
	config.do_interval = 5;
	var inner_box = config.box - config.border * 2;
	
	var x0 = width % config.box / 2;
	var red_line = 150;
	
    var main_block_start = $('.main').offset().left;
    var main_block_stop = main_block_start + $('.main').width();
    var f1 = config.fade_steps[0];
    if (animate){
        var step_no = 0;
        draw_tier(step_no, config.fade_steps[step_no])
        step_no++;
        var stop_starters = setInterval(function(){
            draw_tier(step_no, config.fade_steps[step_no])
            step_no++;
            if (step_no == config.fade_steps.length)
                clearInterval(stop_starters);
        }, config.start_interval);
    }
    else{
        $.each(config.fade_steps, draw_tier);
    }
    
	function draw_tier(i, f2){
        function draw_box(line_sets){
            if (line_sets.colour > config.back || line_sets.colour < config.min_color){
                return false;
            }
            ctx.fillStyle = col(line_sets.colour);
            rect2(line_sets.x, line_sets.y, false);
            line_sets.y += config.box
            // line_sets.fade_rate *= rand_range(0.8, 1.2);
            line_sets.colour -= line_sets.fade_rate;
            return line_sets.y < height;
        }
        var line_settings = []
        for(var x = x0; x < width - config.box; x += config.box){
            var line_sets = {}
            line_sets.colour = rand_range(config.start_min, config.start_max);
            line_sets.step_repeats = rand_range(1, 10);
            line_sets.fade_rate = rand_range(f1, f2);
            f1=f2;
            line_sets.x = x;
            line_sets.y = 0;
            line_settings.push(line_sets);
        }
        if (animate){
            $.each(line_settings, function(){
                var line_sets = this;
                line_sets.stop_line = setInterval(function(){
                    for(var i = 0; i < line_sets.step_repeats; i++){
                        draw_box(line_sets);
                    }
                    if (!draw_box(line_sets))
                        clearInterval(line_sets.stop_line);
                }, rand_range(0,line_sets.fade_rate*2));
            });
        }
        else{
            $.each(line_settings, function(){
                while (true){
                    if (!draw_box(this))
                        break;
                }
            });
        }
    }

	function col(c, s, h){
		var r = Math.round(c);
		return 'rgba(' + r + ', ' + r + ', ' + r + ', 1)';
	}
	
	function rect2(x_in, y_in, stroke) {
		var x = x_in + config.border;
		var y = y_in + config.border;
		var w = inner_box;
		var h = inner_box;
		ctx.beginPath();
		ctx.moveTo(x + config.radius, y);
		ctx.lineTo(x + w - config.radius, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + config.radius);
		ctx.lineTo(x + w, y + h - config.radius);
		ctx.quadraticCurveTo(x + w, y + h, x + w - config.radius, y + h);
		ctx.lineTo(x + config.radius, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - config.radius);
		ctx.lineTo(x, y + config.radius);
		ctx.quadraticCurveTo(x, y, x + config.radius, y);
		ctx.closePath();
		ctx.fill();
		if (stroke)
			ctx.stroke();
	}

	function rand_range(min, max){
		var rand = Math.random()*(max-min);
		rand +=min;
		return rand;
	}
}

(function($) {
    draw_random();
})(jQuery);

$(window).resize(draw_random);