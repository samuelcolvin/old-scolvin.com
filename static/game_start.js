var sys_conf = {};
var game, game_control;

var GameControl = function (){
	var pressed_keys={a:false, d: false, space:false};
	var keys ={65: 'a', 68: 'd', 32: 'space'}
	var focused = true;
	this.stopped = false;
	
	$(document).keyup(function(e){
		pressed_keys[keys[e.keyCode]] = false;
	});

	$(document).keydown(function(e) {
		pressed_keys[keys[e.keyCode]] = true;
	});

	function get_controller_direction(){
		dir = 0
		if (pressed_keys.a)
			dir = -1;
		else if(pressed_keys.d)
			dir = 1;
		return {dir: dir, space: pressed_keys.space};
	}
	
	this.tick = function(dt) {
	   // console.log
		if(focused && !dt.paused){
			var acc = get_controller_direction();
			game.update(acc);
		}
	}

	this.pause_resume_game = function(p) {
		if (typeof(game) == 'undefined')
			return;
		if(p)
			createjs.Ticker.setPaused(true);
		else if (!this.stopped)
			createjs.Ticker.setPaused(false);
		game.last_time_stamp = Date.now();
	}
	window.onfocus = function() { focused = true; game_control.pause_resume_game(false);}
	window.onblur = function() { focused = false; game_control.pause_resume_game(true);}
};

function stop(){
	game_control.stopped = true;
	game_control.pause_resume_game(true);
	$('#menu-title').text('Finished');
	sys_conf.menu.show();
}

function start(){
	game = new Game(null, stop);//sys_conf.debug_canvas
	createjs.Ticker.setPaused(false);
	createjs.Ticker.setFPS(50);
	createjs.Ticker.useRAF = true;
	createjs.Ticker.addEventListener('tick', game_control.tick);
// 	createjs.Ticker.addListener(game_control, true);
}
	
function pause_resume(){
	if (game_control.stopped)
		return;
	game_control.pause_resume_game(!createjs.Ticker.getPaused());
	$('#menu-title').text('Paused');
	sys_conf.menu.toggle();
	$('#pause').text(createjs.Ticker.getPaused() ? 'Continue' : 'Pause');
}
//$(document).ready(start_game);

(function (){
	sys_conf.width = $(window).width();
	sys_conf.height = $(window).height();
	// if (width > height)
		// width -= 400;
	sys_conf.main_canvas = $('#main_canvas');
	sys_conf.main_canvas[0].width = sys_conf.width;
	sys_conf.main_canvas[0].height = sys_conf.height;
	
	sys_conf.debug_canvas = $('#debug_canvas');
	sys_conf.debug_canvas[0].width = sys_conf.width;
	sys_conf.debug_canvas[0].height = sys_conf.height;
	
	var game_div = $('#game');
	game_div.width(sys_conf.width);
	game_div.height(sys_conf.height);
	var left = ($(window).width() - sys_conf.width)/2;
	game_div[0].style.left = left + 'px';
	
	sys_conf.menu = $('#menu');
	var menu_left = (sys_conf.width - 400)/2;
	sys_conf.menu[0].style.left = menu_left + 'px';
	
	game_control = new GameControl();
})();