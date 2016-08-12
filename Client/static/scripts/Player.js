function Organ(xpos, ypos, size, xSpd, ySpd) {
	this.lock = false;		// lock organ position relative to the CM, so any velocity dragging it away from CM will be neglected
	this.x = xpos;
	this.y = ypos;
	this.xspd = xSpd;
	this.yspd = ySpd;
	this.size = size;	
	this.sizeFinal = this.size;	// size will always try to approach sizeFinal. This enables animations. 
	this.color = "blue"; //colors[Math.floor((Math.random() * colors.length))];
	// Easing variables
	this.massDelta = 0.0;
	this.applyPosEase = false;
	this.easeDist = 0.0;
	this.easex = 0.0;
	this.easey = 0.0;

	// bounciness effect variables and function
	// this.equilibrium = [];	// original points at equilibrium
	// this.pts = [];
	// this.ptsCount = 0;	
	// this.restoreSpd = 0.0265;
	// this._beg = 0;
	// this._var = 0;

	// function copyPoint(src) {
	// 	return {
	// 		x : src.x,
	// 		y : src.y,
	// 		r : src.r,
	// 		th : src.th,
	// 	};
	// }


	// this.initPts = function(resetPts) {
	// 	this.equilibrium = [];		
	// 	this.ptsCount = 400;	// more points == finer outer shape and bounciness. 
	// 	if(resetPts)
	// 		this.pts = [];

	// 	var ang = 0.0, incr = 2.0*Math.PI/this.ptsCount;
			
	// 	for (var i = 0; i < this.ptsCount; i++) {
	// 		// user is responsible for making sure polar and cartesian coords of points are matching, for now.
	// 		this.equilibrium[i] = {
	// 			x:  Math.cos(ang)*this.size,
	// 			y:  Math.sin(ang)*this.size,	
	// 			th: ang,			// assert: th is always in [0, 2pi]
	// 			r: this.size
	// 		};
	// 		if(resetPts)
	// 			this.pts[i] = copyPoint(this.equilibrium[i]);
	// 		ang += incr;
	// 	}

	// 	//console.log("sides: "+this.ptsCount);
	// };

	// // the angle of the impact point (from the player's POV), the radius of the arc (in radians) and intensity of the impact 
	// this.impact = function(ang, arcTheta, maxPush) {
	// 	arcTheta *= 0.5;	

	// 	var hitSpot = {
	// 		x:  Math.cos(ang+Math.PI)*this.size,
	// 		y:  Math.sin(ang+Math.PI)*this.size,
	// 	};

	// 	// determine (index of) the closest point to impact location
	// 	var ind = -1, max = -1;
	// 	for (var i = 0; i < this.pts.length; i++) {
	// 		var dist2 = distSq(this.pts[i].x, this.pts[i].y, hitSpot.x, hitSpot.y);
	// 		if(dist2 > max){
	// 			ind = i;
	// 			max = dist2
	// 		}
	// 	}

	// 	hitSpot = copyPoint(this.pts[ind]);

	// 	// how many neighboring points in either direction are gonna be affected ?
	// 	// we want an arc of angle theta to be affected on either side of the (new) hitSpot.
	// 	// each point on the arc will be pushed/displaced by some 
	// 	// amount acording to some function of it's proximity to the hitSpot
	// 	for (var i = 0; i < this.pts.length; i++) {
	// 		var curPt = this.pts[(i+ind)%this.pts.length];

	// 		//if(this.equilibrium[(i+ind)%this.pts.length].r - curPt.r < 0.1)
	// 		//		continue;

	// 		// smallest angle between the two points
	// 		var angularDist = Math.abs(curPt.th - hitSpot.th);
	// 		if(angularDist > Math.PI) angularDist = 2*Math.PI - angularDist;

	// 		// if the current point is within the affected arc:
	// 		if(angularDist <= arcTheta) {
	// 			var prox = Math.abs(1 - angularDist/arcTheta);	// normalize how close curPt to hitSpot is.
	// 			// the function we'll use for interpolating diplacement according to proximity
	// 			var f = function(x) {	// domain is [0,1]
	// 				return 6.0*Math.pow(x,5) - 15.0*Math.pow(x,4)+ 10.0*Math.pow(x,3);
	// 			}
	// 			var displacemntAmt = f(prox)* maxPush;

	// 			// displace it: 
	// 			this.pts[(i+ind)%this.pts.length].x = Math.cos(curPt.th)*(curPt.r - displacemntAmt);
	// 			this.pts[(i+ind)%this.pts.length].y = Math.sin(curPt.th)*(curPt.r - displacemntAmt),
	// 			this.pts[(i+ind)%this.pts.length].r = curPt.r - displacemntAmt;
	// 		}
	// 	}
	// }

	// // restore the points closer to equilibrium
	// this.restore = function() {	
	// 	for (var i = 0; i < this.pts.length; i++) {
	// 		var diff = Math.abs(this.equilibrium[i].r - this.pts[i].r);
	// 		if( diff > 0.1 ) {
	// 			// the offest of the point from the equilibrium
	// 			var dist = Math.sqrt(distSq(this.pts[i].x, this.pts[i].y,	
	// 				 this.equilibrium[i].x, this.equilibrium[i].y));		

	// 			// move the point closer to equilibrium by a reatio of restoreSpd.
	// 			var ang = Math.atan2(this.pts[i].y, this.pts[i].x);
	// 			this.pts[i].x += Math.cos(ang)*dist*this.restoreSpd;
	// 			this.pts[i].y += Math.sin(ang)*dist*this.restoreSpd;
	// 			this.pts[i].r = Math.sqrt(distSq(this.pts[i].x, this.pts[i].y, 0,0));
	// 		}
	// 		else {	// snap this point to equilibrium, it's very close to it
	// 			this.pts[i] = copyPoint(this.equilibrium[i]);
	// 		}			
	// 	}
	// }

	// this.initPts(true);	// should be called everytime the size changes
}

Organ.prototype.move = function() {
	this.x += this.xspd;
	this.y += this.yspd;
};

Organ.prototype.update = function () {
	//this.restore();
	this.move();

	// // TODO: tweak correlation between movement and bounciness	
	// this._var++;
	// if(this._var % ripple.speed == 0){
	// 	var freq = Math.max(Math.random()*ripple.freq,1), ang =  Math.PI*2/freq;
	// 	this._beg += ang;

	// 	for (var i = 0; i < freq; i++) {
	// 		this.impact(i*ang + this._beg, Math.PI/freq, ripple.strength);
	// 	}
	// }

	var dt = timestep/3500.0;
	if(this.applyPosEase){
		this.x += (ease_spd*dt*ease_step*this.easeDist) * this.easex;
		this.y += (ease_spd*dt*ease_step*this.easeDist) * this.easey;
		this.easeDist -= ease_spd*dt*ease_step*this.easeDist;
		if(Math.abs(this.easeDist) <= 0.001){
			this.applyPosEase = false;
			//this.lock = true;			// TODO: investigate 
		}
	}

	dt = timestep/400.0
	if(Math.abs(this.sizeFinal - this.size) > 0.01){		// smoothly decrease mass if this organ has just been split/scattered
		this.massDelta = this.sizeFinal - this.size;
		//var isShrinking = this.massDelta < 0; 
		this.size += ease_spd*dt*this.massDelta*ease_step;
		this.massDelta -= ease_spd*dt*this.massDelta*ease_step;
		if(Math.abs(this.massDelta) <= 0.01)
			this.size = Math.round(this.size*10)/10.0;

		//this.initPts(isShrinking);		// if the size is shrinking
	}
};

Organ.prototype.easePos = function(xdir, ydir) {
	this.easex = xdir;
	this.easey = ydir;
	this.easeDist = this.size*20;				// TODO: tweak this
	this.applyPosEase = true;
};

Organ.prototype.split = function() {
	this.sizeFinal /= 2.0;

	var org2 = new Organ(this.x, this.y, Math.round(this.sizeFinal),
	 		   this.xspd, this.yspd);
	var mag = Math.sqrt((org2.xspd*org2.xspd) + (org2.yspd*org2.yspd));
	org2.easePos(org2.xspd/mag, org2.yspd/mag);

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
		/*var count = this.ptsCount;
		context.beginPath();
		context.moveTo(this.pts[0].x + this.x - xshift, this.pts[0].y + this.y-yshift);
		for (var i = 0; i < count; i++) {
			context.lineTo(this.pts[(i+1)%count].x +this.x-xshift, this.pts[(i+1)%count].y +this.y-yshift);
		}
		context.closePath();
		context.fillStyle = 'rgba(0,0,110,0.9)';
		context.fill();

		// draw inner circles
		context.save();
		context.translate(this.x-xshift, this.y-yshift);
		var scaler = Math.min(0.7 + 0.1*this.size/50, 0.95);
		context.scale(scaler, scaler);
		context.beginPath();
		context.moveTo(this.pts[0].x, this.pts[0].y);
		for (var i = 0; i < count; i++) {
			context.lineTo(this.pts[(i+1)%count].x, this.pts[(i+1)%count].y);
		}
		context.closePath();
		context.fillStyle = 'rgba(0,0,200,0.9)';
		context.fill();
		context.restore();
		*/
		
		context.beginPath();
		context.arc(this.x-xshift,this.y-yshift, this.size, 0,2*Math.PI);
		context.fillStyle = 'rgba(0,50,125,0.9)';
		context.fill();
		context.closePath();

		
		context.beginPath();
		context.arc(this.x-xshift,this.y-yshift, this.size*0.4, 0,2*Math.PI);
		context.fillStyle = 'rgba(0,50,200,0.2)';
		context.fill();
		context.closePath();
		
		// show pts[] ?
		if(showPts) {
			for (var i = 0; i < count; i++) {
				context.beginPath();
				context.arc(this.pts[i].x + this.x - xshift, this.pts[i].y +this.y - yshift, 2, 0,2*Math.PI);
				context.fillStyle = 'red';
				context.fill();
				context.closePath();
			}
		}
			
	}

 	// draw player name
	if(showName){
	 	context.textAlign = 'center';
	    context.font = '30px sans-serif';
		context.strokeStyle = 'black';
	 	context.lineWidth = 3;
		context.strokeText(name, this.x-xshift, this.y-yshift+10);
	    context.fillStyle = 'white';
		context.fillText(name, this.x-xshift, this.y-yshift+10);
	}
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
		if(Math.abs(org1.size-org1.sizeFinal) > 1)
			continue;

		for(var j = i+1; j < this.organs.length; j++){
			var org2 = this.organs[j];

			var radSum = (org2.size+org1.size);		// sum of radii
			var distSqr = distSq(org1.x, org1.y, org2.x, org2.y);	// distance between centers squared

			if(Math.pow(radSum, 2) > distSqr) {		// if there's an intersection 

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

// this function ONLY INTERPLOATES organs x,y and size properties
Player.interpolate = function(srcState,targetState, amt) {	
	var interpolatedState = new Player(src.pid);

	if(targetState == null)		
		copyPlayer(srcState, interpolatedState);
	else if(srcState.organs.length != targetState.organs.length)		// if different number of organs, just return a copy of the target
		copyPlayer(targetState, interpolatedState);
	
	else {
		copyPlayer(srcState, interpolatedState);	// we'll use the srcState as base and started modifing position properties

		//interpolatedState.cmx += lerp(srcState.cmx, targetState.cmx, amt);
		//interpolatedState.cmx += lerp(srcState.cmx, targetState.cmx, amt);

		for (var i = 0; i < srcState.organs.length; i++) {
			var tx = targetState.organs[i].x,
				ty = targetState.organs[i].y,
				tSize = targetState.organs[i].size,
				sx = srcState.organs[i].x,
				sy = srcState.organs[i].y,
				sSize = srcState.organs[i].size;

			interpolatedState.organs[i].x += lerp(sx, tx, amt);
			interpolatedState.organs[i].x += lerp(sy, ty, amt);
			interpolatedState.organs[i].size += lerp(sSize, tSize, amt);
		}
	}
	return interpolatedState;
};

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
		temp.sizeFinal = curOrg.sizeFinal;
		temp.massDelta = curOrg.massDelta;
		temp.applyPosEase = curOrg.applyPosEase;
		temp.easeDist = curOrg.easeDist;
		temp.easex = curOrg.easex;
		temp.easey = curOrg.easey;

		// // we dont want mp's bounciness effects to be affected be all the reconiliation stuff. so we'll just preserver it
		// if(preserveBounce) {		temp.pts = [];
		//  	for (var j = 0; j < curOrg.pts.length; j++) 
		//  		temp.pts[j] = { x:curOrg.pts[j].x, y:curOrg.pts[j].y,
		//  		th:curOrg.pts[j].th, r:curOrg.pts[j].r };
		//  	temp._var = curOrg._var;
		//  	temp._beg = curOrg._beg;
		// }

		target.organs.push(temp);
	}

}

function lerp(a,b,amt){
	return (b-a)*amt;
}