function Organ(xpos, ypos, size, xSpd, ySpd) {
	this.lock = false;		// lock organ position relative to the CM, so any velocity dragging it away from CM will be neglected
	this.x = xpos;
	this.y = ypos;
	this.xspd = xSpd;
	this.yspd = ySpd;
	this.size = size;
	this.color = "blue"; //colors[Math.floor((Math.random() * colors.length))];
	// Easing variables
	this.applySizeEase = false;
	this.massDelta = 0.0;
	this.applyPosEase = false;
	this.easeDist = 0.0;
	this.easex = 0.0;
	this.easey = 0.0;

	// bounciness effect variables and function
	this.equilibrium = [];	// original points at equilibrium
	this.pts = [];
	this.ptsCount = 0;	
	this.restoreSpd = 0.026;

	this.initPts = function() {
		this.equilibrium = [];
		this.pts = [];
		this.ptsCount = Math.floor(this.size * 1.0);	// more points == finer outer shape and bounciness 

		var ang = 0.0, incr = 2.0*Math.PI/this.ptsCount;
			
		for (var i = 0; i < this.ptsCount; i++) {
			this.pts[i] = {
				x:  Math.cos(ang)*this.size,
				y:  Math.sin(ang)*this.size,
			};
			this.equilibrium[i] = this.pts[i];
			ang += incr;
		}

		console.log("sides: "+this.ptsCount);
	};

	// the angle of the impact point (from the player's POV), the radius and intensity of the impact 
	this.impact = function(ang, hitRad, maxPush){		
		var hitSpot = {
			x:  Math.cos(ang)*this.size,
			y:  Math.sin(ang)*this.size,
		};
		
		for (var i = 0; i < this.pts.length; i++) {
			var dist2 = distSq(this.pts[i].x, this.pts[i].y, hitSpot.x, hitSpot.y);

			if(dist2 > hitRad*hitRad) 	// if this point isnt within the impact circle
				continue;

			/* TODO: come up with better way to handle this*/

			// the proximity to the hitSpot, a value between [0,1]
			var prox = 1 - Math.sqrt(dist2/(hitRad*hitRad));	
			
			// determine how the points will be displaced
			var displacemnt = Math.sqrt(Math.sin(prox)) * this.size * maxPush; // TODO: improve/replace			
			   
			// displace the point  
			var ang = Math.atan2(this.pts[i].y, this.pts[i].x);
			this.pts[i] = {
				x: Math.cos(ang)*(this.size - displacemnt),
				y: Math.sin(ang)*(this.size - displacemnt),
			};
		}
	};

	// restore the points closer to equilibrium
	this.restore = function(){	
		for (var i = 0; i < this.pts.length; i++) {
			if(this.pts[i].x != this.equilibrium[i].x || this.pts[i].y != this.equilibrium[i].y){
				// the offest of the point from the equilibrium
				var dist = Math.sqrt(distSq(this.pts[i].x, this.pts[i].y,	
					 this.equilibrium[i].x, this.equilibrium[i].y));		
				if(dist <= 0.001){	// if the point is very close to equilibrium just set it there
					this.pts[i] = this.equilibrium[i]
					continue;
				}
				// move the point closer to equilibrium by a ratio of restoreSpd.
				var ang = Math.atan2(this.pts[i].y, this.pts[i].x);
				this.pts[i].x += Math.cos(ang)*dist*this.restoreSpd;
				this.pts[i].y += Math.sin(ang)*dist*this.restoreSpd;
			}			
		}
	}

	this.initPts();	// should be called everytime the size changes
}

Organ.prototype.move = function() {
	this.x += this.xspd;
	this.y += this.yspd;
};

Organ.prototype.update = function () {
	this.restore();
	this.move();

	// TODO: tweak correlation between movement and bounciness. right now it's just random
	if(Math.random() < 0.022) {		// apply some random bouncing effects
		(Math.random() < 0.4) ?	this.impact(Math.random()*2*Math.PI, 50, 0.09) :
				this.impact(Math.random()*2*Math.PI, 30, 0.06) ;	
	}

	var dt = timestep/1000;
	if(this.applyPosEase){
		this.x += (ease_spd*dt*ease_step*this.easeDist) * this.easex;
		this.y += (ease_spd*dt*ease_step*this.easeDist) * this.easey;
		this.easeDist -= ease_spd*dt*ease_step*this.easeDist;
		if(Math.abs(this.easeDist) <= 0.001){
			this.applyPosEase = false;
			//this.lock = true;			// TODO: investigate 
		}
	}

	if(this.applySizeEase){
		this.size += ease_spd*dt*this.massDelta*ease_step;
		this.massDelta -= ease_spd*dt*this.massDelta*ease_step;
		if(Math.abs(this.massDelta) <= 0.001)
			this.applySizeEase = false;

		this.initPts();		// size has changed... all bounciness variables need an update!!
	}
};

Organ.prototype.easePos = function(xdir, ydir) {
	this.easex = xdir;
	this.easey = ydir;
	this.easeDist = this.size*20;				// TODO: tweak this
	this.applyPosEase = true;
};

Organ.prototype.easeSize = function(mass_delta) {
	this.massDelta = mass_delta;
	this.applySizeEase = true;
};

Organ.prototype.split = function() {
	this.easeSize(-this.size/2.0);
	var org2 = new Organ(this.x, this.y, this.size/2,
	 		   this.xspd, this.yspd);
	var norm = Math.sqrt((org2.xspd*org2.xspd) + (org2.yspd*org2.yspd));
	org2.easePos(org2.xspd/norm, org2.yspd/norm);

	return org2;
};

Organ.prototype.draw = function (context, name, isServer) {
	if(isServer) {
		context.beginPath();
		context.arc(this.x-xshift,this.y-yshift, this.size, 0,2*Math.PI);
		context.fillStyle = 'rgba(255,0,0,0.3)';
		context.fill();
		context.closePath();
	}
	
	else {
		// draw the organ main skeleton: connect pts[] with lines to give the organ it's circular bouncy shape, then fill.
		var count = this.ptsCount;
		context.beginPath();
		context.moveTo(this.pts[0].x + this.x - xshift, this.pts[0].y + this.y-yshift);
		for (var i = 0; i < count; i++) {
			context.lineTo(this.pts[(i+1)%count].x +this.x-xshift, this.pts[(i+1)%count].y +this.y-yshift);
		}
		context.closePath();
		context.fillStyle = 'rgba(0,0,100,0.85)';
		context.fill();
		
		// draw inner circles
		context.beginPath();
		context.arc(this.x-xshift,this.y-yshift, this.size*0.88, 0,2*Math.PI);
		context.fillStyle = 'rgba(0,50,125,0.9)';
		context.fill();
		context.closePath();

		context.beginPath();
		context.arc(this.x-xshift,this.y-yshift, this.size*0.4, 0,2*Math.PI);
		context.fillStyle = 'rgba(0,50,200,0.2)';
		context.fill();
		context.closePath();
		
		/*
		// show pts[]
		for (var i = 0; i < count; i++) {
			context.beginPath();
			context.arc(this.pts[i].x + this.x - xshift, this.pts[i].y +this.y - yshift, 2, 0,2*Math.PI);
			context.fillStyle = 'red';
			context.fill();
			context.closePath();
		}
		*/
	}

 	// draw player name
 	context.textAlign = 'center';
    context.font = '30px sans-serif';
	context.strokeStyle = 'black';
 	context.lineWidth = 3;
	context.strokeText(name, this.x-xshift, this.y-yshift+10);
    context.fillStyle = 'white';
	context.fillText(name, this.x-xshift, this.y-yshift+10);
};

/**********************************************************************************/

function Player(player_id) {
	this.pid = player_id;
	this.organs = [];
	this.cmx;		// center of mass (CM), the point equidistant from all organs
	this.cmy;
	this.directX = 0;	// direction in which CM is headed
	this.directY = 0;
}

Player.prototype.constrain = function(){	// constrain organs movements
	// after the organs are packed, they can't keep going in their direction, they have to start going in the CM direction
	for(var i = 0; i < this.organs.length; i++) {
		var org = this.organs[i];
		if(org.lock) {
			var mag = Math.sqrt(org.xspd*org.xspd + org.yspd*org.yspd);
			var ang = Math.atan2( this.directY, this.directX);
			org.xspd = Math.cos(ang) * mag;
			org.yspd = Math.sin(ang) * mag;
		}
	}

	// check for collision between mp's organs
	for(var i = 0; i < this.organs.length-1; i++) {
		var org1 = this.organs[i];
		for(var j = i+1; j < this.organs.length; j++){
			var org2 = this.organs[j];

			var radSum = org2.size+org1.size;		// sum of radii
			var distSqr = distSq(org1.x, org1.y, org2.x, org2.y);	// distance between centers squared

			if(radSum*radSum + 0.5 > distSqr) {		// if there's an intersection

				var interleave = radSum - Math.sqrt(distSqr);	// how much are the two circles intersecting?  r1 + r2 - distnace

				// create a vector o12 going from org1 to org2
				// push the two organs apart, push org2 in the direction of the o12, and org1 in the opposite direction of o12
				var o12x = org2.x - org1.x,	o12y = org2.y - org1.y;
				var o12ang = Math.atan2(o12y,o12x);
				// the exact distnace each one will be pushed(from its original location) is interleave/2
				org2.x += Math.cos(o12ang) * (interleave/2);
				org2.y += Math.sin(o12ang) * (interleave/2);
				org1.x += Math.cos(o12ang) * (-interleave/2);
				org1.y += Math.sin(o12ang) * (-interleave/2);

				org1.lock = true;
				org2.lock = true;
			}

		}

	}

};

Player.prototype.calCM = function() {
	var avgX = 0.0, avgY = 0.0;
	var count = this.organs.length;

	for(var i=0; i < count; i++) {
		avgX += this.organs[i].x;
		avgY += this.organs[i].y;
	}

	this.cmx = avgX/count;
	this.cmy = avgY/count;
};

Player.prototype.update = function (){
	for(var i=0; i<this.organs.length; i++)
		this.organs[i].update();
	this.constrain();
	this.calCM();
};
/*
Player.prototype.interpolate = function(targetPlayer, rate) {
	//var min = Math.min(this.organs.length, targetPlayer.organs.length);
	if(this.organs.length != targetPlayer.organs.length)
		return;
	for (var i = 0; i < this.organs.length; i++) {
		var targetX = targetPlayer.organs[i].x,
			targetY = targetPlayer.organs[i].y;

		var org = this.organs[i];
		    mag   = rate * Math.sqrt( (org.x-targetX)*(org.x - targetX) + (org.y-targetY)*(org.y-targetY) ),
		    xdir  = targetX - org.x,
		    ydir  = targetY - org.y;
		  	ang   = Math.atan2(ydir,xdir);
		org.x += Math.cos(ang)*mag;
		org.y += Math.sin(ang)*mag;
	}
	this.calCM();
};
*/
/**********************************************************************************/
function copyPlayer(src, target, preserveBounce){
	target.organs = [];
	target.pid = src.pid;
	target.directX = src.directX;
	target.directY = src.directY;
	target.cmx = src.cmx;
	target.cmy = src.cmy;

	// fill in targets's organs[]
	for(var i=0; i< src.organs.length; i++) {
		var curOrg = src.organs[i];

		var temp = new Organ(curOrg.x, curOrg.y, curOrg.size,
			curOrg.xspd, curOrg.yspd);
		temp.lock = curOrg.lock;
		temp.applySizeEase = curOrg.applySizeEase;
		temp.massDelta = curOrg.massDelta;
		temp.applyPosEase = curOrg.applyPosEase;
		temp.easeDist = curOrg.easeDist;
		temp.easex = curOrg.easex;
		temp.easey = curOrg.easey;

		if(preserveBounce) {	// 
		 	temp.pts = [];
		 	for (var j = 0; j < curOrg.pts.length; j++) 
		 		temp.pts[j] = {x:curOrg.pts[j].x, y:curOrg.pts[j].y};
		}

		target.organs.push(temp);
	}

}