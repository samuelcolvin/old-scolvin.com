var Game = function (debug_canvas, stopper) {
	var stopper_func = stopper;
	var show_debug = debug_canvas != null;
	
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2Fixture = Box2D.Dynamics.b2Fixture;
	var b2World = Box2D.Dynamics.b2World;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
	
	//setup
	var SETTINGS = {}
    SETTINGS.BUMP_MAX = 40;
    SETTINGS.BUMP_DROP_VEL = 30;
    SETTINGS.BUMP_VEL = 20;
	SETTINGS.CON_ACCEL = 250;
    SETTINGS.CON_MAX_V = 400;
    SETTINGS.CON_E_ENDS = 0.5;
    SETTINGS.CON_E = 1.5;
    SETTINGS.CON_FR = 0.9;
    SETTINGS.WALL_FR = 0.1;
    SETTINGS.WALL_E = 0.5;
    SETTINGS.BALL_D = 1;
    SETTINGS.BALL_E = 0.7;
    SETTINGS.BALL_FR = 0.3;
    SETTINGS.BALL_DAMP_L = 0.35;
    SETTINGS.BALL_DAMP_A = 0.05;
    SETTINGS.BALLOON_D = 0.2;
    SETTINGS.BALLOON_E = 0.8;
    SETTINGS.BALLOON_FR = 0.9;
    SETTINGS.BALLOON_DAMP_L = 1.1;
    SETTINGS.BALLOON_DAMP_A = 1.2;
	SETTINGS.GRAVITY = 3;
	SETTINGS.BUOYANCY = SETTINGS.GRAVITY*-1.3;
	SETTINGS.BALLOONS = Math.floor((sys_conf.width)/400);
	SETTINGS.BALLOONS = SETTINGS.BALLOONS > 0 ? SETTINGS.BALLOONS : 1;
	SETTINGS.MIN_GAP = 70*70;
    
    var score = 0;
    
	var SCALE = 30, STEP = 20, TIMESTEP = 1/STEP;

	var context, debug_cxt, stage;

	var world;
	this.last_time_stamp = Date.now();
	var fixed_ts_accum = 0;
	var actors = [];
	var controller, arrow_shape;

	// box2d world setup and boundaries
	var setup = function() {
	
		if (show_debug){
			sys_conf.debug_canvas.show();
			debug_cxt = sys_conf.debug_canvas[0].getContext('2d');
		}
		else
			sys_conf.debug_canvas.hide();
		//canvas:
		sys_conf.menu.hide();
		stage = new createjs.Stage(sys_conf.main_canvas[0]);
		stage.snapPixelsEnabled = true;
			
		//box2d:
		world = new b2World(new b2Vec2(0, SETTINGS.GRAVITY), false);
		if (show_debug)
			add_debug();
			
		// boundaries - floor
		var floor_body_def = new b2BodyDef;
		floor_body_def.type = b2Body.b2_staticBody;
		floor_body_def.position.x = 0 / SCALE;
		floor_body_def.position.y = (sys_conf.height + 200) / SCALE;
		var floor = world.CreateBody(floor_body_def);
		var floorFixture = new b2FixtureDef;
		floorFixture.restitution = 0.8;
		floorFixture.shape = new b2PolygonShape;
		floorFixture.shape.SetAsBox(sys_conf.width / SCALE, 10 / SCALE);
		floor.CreateFixture(floorFixture);
		
		// boundaries - left
		var leftFixture = new b2FixtureDef;
		leftFixture.friction = SETTINGS.WALL_FR;
		leftFixture.restitution = SETTINGS.WALL_E;
		leftFixture.shape = new b2PolygonShape;
		leftFixture.shape.SetAsBox(10 / SCALE, 6 * sys_conf.height / SCALE);
		var left_body_def = new b2BodyDef;
		left_body_def.type = b2Body.b2_staticBody;
		left_body_def.position.x = -10 / SCALE;
		left_body_def.position.y = -4 * sys_conf.height / SCALE;
		var left = world.CreateBody(left_body_def);
		left.CreateFixture(leftFixture);
		
		// boundaries - right
		var rightFixture = new b2FixtureDef;
		rightFixture.friction = SETTINGS.WALL_FR;
		rightFixture.restitution = SETTINGS.WALL_E;
		rightFixture.shape = new b2PolygonShape;
		rightFixture.shape.SetAsBox(10 / SCALE, 6 * sys_conf.height / SCALE);
		var right_body_def = new b2BodyDef;
		right_body_def.type = b2Body.b2_staticBody;
		right_body_def.position.x = (sys_conf.width + 10) / SCALE;
		right_body_def.position.y = -4 * sys_conf.height / SCALE;
		var right = world.CreateBody(right_body_def);
		right.CreateFixture(rightFixture);
		
		var arrow_graphics = new createjs.Graphics();
		arrow_graphics.beginFill('#666');
		var arrow_dims={width:2.5, height:25, head_h:10, head_w: 6};
		arrow_graphics.moveTo(-arrow_dims.width, arrow_dims.height);
		arrow_graphics.lineTo(-arrow_dims.width, arrow_dims.head_h);
		arrow_graphics.lineTo(-arrow_dims.head_w, arrow_dims.head_h);
		arrow_graphics.lineTo(0, 0);
		arrow_graphics.lineTo(arrow_dims.head_w, arrow_dims.head_h);
		arrow_graphics.lineTo(arrow_dims.width, arrow_dims.head_h);
		arrow_graphics.lineTo(arrow_dims.width, arrow_dims.height);
		arrow_shape = new createjs.Shape(arrow_graphics);
		arrow_shape.y = 0;
		arrow_shape.x = -100;
		arrow_shape.snapToPixel = true;
		arrow_shape.mouseEnabled = false;
		stage.addChild(arrow_shape);
		
		
		create_ball();
		for (var i = 1; i <= SETTINGS.BALLOONS; i++)
			create_balloon(i);
		
		controller = new Controller();
	};

	function add_debug() {
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(debug_cxt);
		debugDraw.SetDrawScale(SCALE);
		debugDraw.SetFillAlpha(0.7);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		world.SetDebugDraw(debugDraw);
	}

	var Actor = function(body, skin, type) {
		this.body = body;
		this.skin = skin;
		this.type = type;
		this.update = function() {  // translate box2d positions to pixels
			this.skin.rotation = this.body.GetAngle() * (180 / Math.PI);
			this.skin.x = this.body.GetWorldCenter().x * SCALE;
			this.skin.y = this.body.GetWorldCenter().y * SCALE;
			if (this.type == 'balloon'){
				var ant_gravity = new b2Vec2(0, SETTINGS.BUOYANCY*this.body.GetMass());
				var apply_at = this.body.GetWorldPoint(new b2Vec2(0, -30 / SCALE))
				this.body.ApplyForce(ant_gravity, apply_at);
			}
			if (this.type == 'ball'){
				if (this.skin.y > (sys_conf.height + 50))
					stopper_func();
				if (this.skin.y < -50){
					arrow_shape.x = this.skin.x;
					arrow_shape.y = -this.skin.y/10;
				}
				else
					arrow_shape.x = -100;
			}
			else if(this.skin.y < -90 && this.type == 'balloon'){
				recycle_balloon(this);
			}
		}
		actors.push(this);
	}
	
	function recycle_balloon(actor){
		score -= 100;
		stage.removeChild(actor.skin);
		actors.splice(actors.indexOf(actor),1);
		actor.body.SetUserData(null);
		world.DestroyBody(actor.body);
		create_balloon(actor.ball_no);
	}

	function create_ball() {
		var radius = 50;
		var ball = new createjs.Bitmap('/static/football.png');
		ball.regX = radius;   // important to set origin point to center of your bitmap
		ball.regY = radius; 
		ball.snapToPixel = true;
		ball.mouseEnabled = false;
		stage.addChild(ball);
		
        var vari = 5;
		ball.x = random_range(sys_conf.width/2 - vari, sys_conf.width/2 + vari);
		ball.y =  random_range(sys_conf.height - 500, sys_conf.height - 200);
		
		var ball_fix = new b2FixtureDef;
		ball_fix.density = SETTINGS.BALL_D;
		ball_fix.restitution = SETTINGS.BALL_E;
		ball_fix.friction = SETTINGS.BALL_FR;
		ball_fix.linearDamping = SETTINGS.BALL_DAMP_L;
		ball_fix.angularDamping = SETTINGS.BALL_DAMP_A;
		ball_fix.shape = new b2CircleShape(radius / SCALE);
		ball_fix.userData = 'b';
		var ball_body_def = new b2BodyDef;
		ball_body_def.type = b2Body.b2_dynamicBody;
		ball_body_def.position.x = ball.x / SCALE;
		ball_body_def.position.y = ball.y / SCALE;
		var ball_body = world.CreateBody(ball_body_def);
		ball_body.CreateFixture(ball_fix);
		ball_body.SetLinearDamping(SETTINGS.BALL_DAMP_L);
		ball_body.SetAngularDamping(SETTINGS.BALL_DAMP_A);
		
		var actor = new Actor(ball_body, ball, 'ball');
		ball_body.SetUserData(actor);
	}

	function create_balloon(ball_no) {
		var max_balls = 4;
		if (ball_no > max_balls)
			ball_no = ball_no % max_balls + 1;
		var radius = 65;
		var balloon = new createjs.Bitmap('/static/balloon' + ball_no + '.png');
		balloon.regX = radius;   // important to set origin point to center of your bitmap
		balloon.regY = 75; 
		balloon.snapToPixel = true;
		balloon.mouseEnabled = false;
		stage.addChild(balloon);
		
		var close = true;
		while (close){
			balloon.x = random_range(100, sys_conf.width - 100);
			balloon.y = random_range(100, sys_conf.height - 200);
			close = check_close(balloon);
		}
		
		var balloon_fix = new b2FixtureDef;
		balloon_fix.density = SETTINGS.BALLOON_D;
		balloon_fix.restitution = SETTINGS.BALLOON_E;
		balloon_fix.friction = SETTINGS.BALLOON_FR;
		balloon_fix.shape = new b2PolygonShape;
        balloon_fix.shape.SetAsArray(get_shape());
		balloon_fix.userData = 'oon';
		var balloon_body_def = new b2BodyDef;
		balloon_body_def.type = b2Body.b2_dynamicBody;
		balloon_body_def.position.x = balloon.x / SCALE;
		balloon_body_def.position.y = balloon.y / SCALE;
		var balloon_body = world.CreateBody(balloon_body_def);
		balloon_body.CreateFixture(balloon_fix);
		balloon_body.SetLinearDamping(SETTINGS.BALLOON_DAMP_L);
		balloon_body.SetAngularDamping(SETTINGS.BALLOON_DAMP_A);

		var actor = new Actor(balloon_body, balloon, 'balloon');
		actor.ball_no = ball_no;
		balloon_body.SetUserData(actor);
		
		function check_close(balloon){
			for(var i=0; i < actors.length; i++) {
				var body = actors[i].skin;
				var d = (body.x - balloon.x)*(body.x - balloon.x);
				d += (body.y - balloon.y)*(body.y - balloon.y);
				if (d < SETTINGS.MIN_GAP)
					return true;
			}
			return false;
		}
		
       	function get_shape(){
       		var shape = [];
            shape.push(new b2Vec2(-65 / SCALE, 0 / SCALE));
            shape.push(new b2Vec2(-46 / SCALE, -46 / SCALE));
            shape.push(new b2Vec2(0 / SCALE, -65 / SCALE));
            shape.push(new b2Vec2(46 / SCALE, -46 / SCALE));
            shape.push(new b2Vec2(65 / SCALE, 0 / SCALE));
            shape.push(new b2Vec2(55 / SCALE, 45 / SCALE));
            shape.push(new b2Vec2(46 / SCALE, 55 / SCALE));
            shape.push(new b2Vec2(25 / SCALE, 80 / SCALE));
            shape.push(new b2Vec2(0 / SCALE, 93 / SCALE));
            shape.push(new b2Vec2(-25 / SCALE, 80 / SCALE));
            shape.push(new b2Vec2(-46 / SCALE, 55 / SCALE));
            shape.push(new b2Vec2(-55 / SCALE, 45 / SCALE));
            return shape;
       	}
	}
	
	function random_range(min, max){
		var diff = max - min;
		return Math.random()*diff + min;
	}
	
	function Controller(){
		var con_v = {x: 0, y: 0};
		var con_pos = sys_conf.width /2;
        var left_lim_c = 0;
        var right_lim_c = sys_conf.width;
        var default_y_pos = sys_conf.height - 60;
        
		var con_bmp = new createjs.Bitmap('/static/head.png');
		con_bmp.regX = 110;
		con_bmp.regY = 30;
		con_bmp.y = default_y_pos;
		con_bmp.x = con_pos;
		con_bmp.snapToPixel = true;
		con_bmp.mouseEnabled = false;
		stage.addChild(con_bmp);
		
		var con_body_def = new b2BodyDef;
		con_body_def.type = b2Body.b2_kinematicBody;
		con_body_def.position.y = con_bmp.y / SCALE;
		con_body_def.position.x = con_bmp.x / SCALE;
		var con_fix = new b2FixtureDef;
		con_fix.restitution = SETTINGS.CON_E;
		con_fix.friction = SETTINGS.CON_FR;
		con_fix.shape = new b2PolygonShape;
        con_fix.shape.SetAsArray(get_shape());
		con_fix.userData = 0;
		var con_body = world.CreateBody(con_body_def);
		con_body.CreateFixture(con_fix);
        
		var con_actor = new Actor(con_body, con_bmp, 'controller');
		con_body.SetUserData(con_actor);
		con_actor.update()
        
		var bumping=false;
		this.update = function(controls){
			var con_y = con_actor.body.GetWorldCenter().y
            con_pos = con_actor.body.GetWorldCenter().x * SCALE;
            con_v.x += controls.dir * SETTINGS.CON_ACCEL * TIMESTEP;
            if (Math.abs(con_v.x) > SETTINGS.CON_MAX_V) {
                if (con_v.x > 0) { con_v.x = SETTINGS.CON_MAX_V }
                else { con_v.x = -SETTINGS.CON_MAX_V }
            }
            if (con_pos < left_lim_c) {
                con_actor.body.SetPosition(new b2Vec2(left_lim_c / SCALE, con_y));
                con_v.x = -con_v.x * SETTINGS.CON_E_ENDS
            }
            if (con_pos > right_lim_c) {
                con_actor.body.SetPosition(new b2Vec2(right_lim_c / SCALE, con_y));
                con_v.x = -con_v.x * SETTINGS.CON_E_ENDS
            }
			
			bumping = controls.space ? true : bumping;
            
            var y_position = con_y * SCALE;
        	if (y_position < (default_y_pos - SETTINGS.BUMP_MAX)){
	            if (bumping)
	            	con_v.y = 0;
	            else
	            	con_v.y = SETTINGS.BUMP_DROP_VEL;
				bumping = false;
        	}
        	else{
	            if (bumping){
	            	con_v.y += -SETTINGS.BUMP_VEL;
	            }
	            else if (y_position > default_y_pos){
	            	con_v.y = 0;
	            }
	            else{
	            	con_v.y += SETTINGS.BUMP_DROP_VEL;
	            }
           }
           //debug_write('con_v.x = ' + Math.round(con_v.x) + ', con_v.y = ' + Math.round(con_v.y) + ', con_pos = ' + Math.round(con_pos));
           con_actor.body.SetLinearVelocity(new b2Vec2(con_v.x / SCALE, con_v.y / SCALE));
       	}
       	
       	function get_shape(){
       		var shape = [];
            shape.push(new b2Vec2(-105 / SCALE, 70 / SCALE));
            shape.push(new b2Vec2(-105 / SCALE, 50 / SCALE));
            shape.push(new b2Vec2(-100 / SCALE, 30 / SCALE));
            shape.push(new b2Vec2(-85 / SCALE, 10 / SCALE));
            shape.push(new b2Vec2(-60 / SCALE, -10 / SCALE));
            shape.push(new b2Vec2(-30 / SCALE, -20 / SCALE));
            shape.push(new b2Vec2(0 / SCALE, -22 / SCALE));
            shape.push(new b2Vec2(30 / SCALE, -20 / SCALE));
            shape.push(new b2Vec2(60 / SCALE, -10 / SCALE));
            shape.push(new b2Vec2(85 / SCALE, 10 / SCALE));
            shape.push(new b2Vec2(100 / SCALE, 30 / SCALE));
            shape.push(new b2Vec2(105 / SCALE, 50 / SCALE));
            shape.push(new b2Vec2(105 / SCALE, 70 / SCALE));
            return shape;
       	}
	}
	
	function scoring(contact){
		var uda = contact.GetFixtureA().GetUserData();
		var udb = contact.GetFixtureB().GetUserData();
		if ((uda == 'oon' && udb == 'b') || (uda == 'a' && udb == 'oon'))
			score += 10;
	}

	// box2d update function. delta time is used to avoid differences in simulation if frame rate drops
	this.update = function(accels) {
		var now = Date.now();
		var dt = now - this.last_time_stamp;
		fixed_ts_accum += dt;
		this.last_time_stamp = now;
		while(fixed_ts_accum >= STEP) {
			for(var i=0; i < actors.length; i++) {
				actors[i].update();
			}

			world.Step(TIMESTEP, 10, 10);

			fixed_ts_accum -= STEP;
			world.ClearForces();
			if (show_debug){
				world.m_debugDraw.m_sprite.graphics.clear();
				world.DrawDebugData();
			}
			controller.update(accels);
		}
		var contact = world.GetContactList();
		while (contact != null){
			scoring(contact)
			contact = contact.GetNext();
		}
		$('.score').text('Score: ' + score);
		//debug_write('bodies: ' + world.GetBodyCount() + ', actors: ' + actors.length)
		stage.update();
	}
	setup();
}




