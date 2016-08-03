/*
	This's a server-independent demo of the game for convenience,
	and also because the full code is buggy (yes even buggier than this xD) and in
	the middle of an upgrade. 
*/

// The lingo I'm using:
// blob == food,  organ == cell
// CM == player's center of mass, always at the center of the screen

/* Blob-related variables */
var blobSize = 12,	// blob radius on screen
	blobDensity = 1.0/1700, //  (blobs_areas) / available_area
 	blobFactor = 20, // how much size increases by eating a blob
 	blobs = [];	

/* Other variables */
var colors = ["magenta", "yellow", "purple", "pink", "chartreuse", "orange", "aqua", "bronze", "red"],
    wrdWidth = 6000, wrdHeight = 6000,				// world dimensions
    inBuff = [],
    ease_step = 0.45, ease_spd = 10,
    lastTime, times = 60, ms = 1000.0 / times, delta = 0.0,		// for delta-timing and FPS control
    xshift, yshift,			// for translating the world to be in main player's perspective
    batch_size = 30,		// how many user inputs to handle and send each frame  TODO: tweak
    fps, fps_arr = [], _ind_ = 0;	// for showing fps

/*************************************************************************************************************************/
function Organ(xpos, ypos, size, xSpd, ySpd) {
	this.lock = false;		// prevent organ from going apart and lock it in place (relative to CM)
	this.x = xpos;
	this.y = ypos;
	this.xspd = xSpd;
	this.yspd = ySpd;
	this.size = size;
	this.color = 'blue';
	this.name = '';
	// Easing variables
	this.applySizeEase = false;
	this.massDelta = 0.0;
	this.applyPosEase = false;
	this.easeDist = 0.0;
	this.easex = 0.0;
	this.easey = 0.0;
}

Organ.prototype.move = function(){
	this.x += this.xspd;
	this.y += this.yspd;
};

Organ.prototype.update = function () {
	this.move();

	// I'm using a sloppy lerping hack for projectile motion
	// cuz I'm lazy and I happen to have it lying around.
	// Will switch to forces later.

	var dt = 1.0/times;
	if(this.applyPosEase){		// smoothly launch and ease toward distnation if this organ is launching
		this.x += (ease_spd*dt*ease_step*this.easeDist) * this.easex;
		this.y += (ease_spd*dt*ease_step*this.easeDist) * this.easey;
		this.easeDist -= ease_spd*dt*ease_step*this.easeDist;
		if(Math.abs(this.easeDist) <= 0.001)
			this.applyPosEase = false;
	}
	
	if(this.applySizeEase){		// smoothly decrease mass if this organ has just been split
		this.size += ease_spd*dt*this.massDelta*ease_step;
		this.massDelta -= ease_spd*dt*this.massDelta*ease_step;
		if(Math.abs(this.massDelta) <= 0.001)
			this.applySizeEase = false;
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

Organ.prototype.draw = function (context) {
	context.beginPath();
	context.arc(this.x - xshift, this.y - yshift, this.size, 0,2*Math.PI);
	context.fillStyle = this.color;
	context.fill();	 	context.textAlign = 'center';

  context.font = '30px sans-serif';
	context.strokeStyle = 'black';
 	context.lineWidth = 3;
	context.strokeText(this.name, this.x-xshift, this.y-yshift+10);
  context.fillStyle = 'white';
	context.fillText(this.name, this.x-xshift, this.y-yshift+10);	
};

/************************************************/
function Player() {
	this.organs = []
	this.cmx = 0;		// center of mass (CM), the point equidistant from all organs
	this.cmy = 0;
	this.directX = 0;	// direction in which CM is headed
	this.directY = 0;
}

Player.prototype.constrain = function(){	// constrain organs movements
	// after the organs are packed, they can't keep going in their direction, they have to start going in the CM direction
	/*for(var i = 0; i < this.organs.length; i++) {
		var org = this.organs[i];
		if(org.lock && (org.applyPosEase == false) && (org.applyPosEase == false)) {
			var mag = Math.sqrt(org.xspd*org.xspd + org.yspd*org.yspd);
			var ang = Math.atan2( this.directY, this.directX);
			org.xspd = Math.cos(ang) * mag;
			org.yspd = Math.sin(ang) * mag;
			org.name = 'c';
		}
	}*/

	// check for collision between mp's organs
	for(var i = 0; i < this.organs.length-1; i++) {
		var org1 = this.organs[i];
		for(var j = i+1; j < this.organs.length; j++){
			var org2 = this.organs[j];

			var radSum = org2.size+org1.size;		// sum of radii
			var distSqr = distSq(org1.x, org1.y, org2.x, org2.y);	// distance between centers squared

			if( Math.pow(radSum, 2) + 0.5>  distSqr) {		// if there's an intersection 

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

				//org1.lock = true;
				//org2.lock = true;
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

/************************************************/

function Blob (x,y,col) {
	this.x = x;
	this.y = y;
	this.color = col;
	this.ang = Math.random()*Math.PI;
	this.isVirus = false;
}

/*************************************************************************************************************************/
var nnn = 0;
window.onload = function() {	
	setInterval(function(){
		console.log(nnn);
		nnn=0;
	}, 1000);
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight;
	var ready = false;
	var infoPan = new InfoPan();		// debug menu
	window.onresize = function(event) {
		// update stuff that depend on the window size.... 
		// I know so sloppy.... will look into stuff like bootstrap later. Baby steps XD
	    width = canvas.width = window.innerWidth;
		height = canvas.height = window.innerHeight;
	    infoPan.refresh();
	};
	var mp;		// main player

	init();


function init(){
	generateBlobs();	
	initFPS();

	// initilaize player's properties
	mp = new Player();
	mp.organs.push(new Organ(0, 0, 65, 6, 6));  
	mp.cmx = mp.organs[0].x;						
	mp.cmy = mp.organs[0].y; 


	addEventListeners();
	infoPan.show();	
	ready = true;
	lastTime = performance.now();
	run(); // Start gameplay
}

function addEventListeners(){

	// mouse click to fire
	document.body.addEventListener("mousemove", function(event) {
		inBuff.push({	
			xdir : event.clientX-(width/2.0),
			ydir : event.clientY-(height/2.0),
			inType : "mm"
		});
	});

	document.body.addEventListener("mousedown", function(event) {
		inBuff.push({	
			xdir : event.clientX-(width/2.0),
			ydir : event.clientY-(height/2.0),
			inType : "md"
		});
	});
}

function run() {		// Main game-loop function
	if(ready) {
		console.log('running');
		var batchSize = batch_size;
		while(batchSize > 0 && inBuff.length>0) {
		var input = inBuff.shift();			// shift() removes the first element.... as in Queues
			process(input);
			batchSize--;
		}
		
		var now = performance.now();
		calcFPS(now);
	    delta += (now - lastTime) / ms;  // detla += actual elapsed time / time required for 1 update 
		lastTime = now;

		if(delta >= 1) { 
			// updates here:   will run at times/second
			for(var i=0; i<mp.organs.length; i++) 
				mp.organs[i].update();
			mp.constrain();	
			mp.calCM();
			nnn++;
			delta--;
		}

		context.clearRect(0, 0, width, height);
		xshift = mp.cmx - width/2;
		yshift = mp.cmy - height/2; 
		drawGrid();
		drawBlobs();

		for(var i=0; i<mp.organs.length; i++) 
			mp.organs[i].draw(context);
		
		// draw info on debug panel
		infoPan.updateData({
			cmx: Math.round(mp.cmx*100.0)/100,
			cmy: Math.round(mp.cmy*100.0)/100,
			num:  mp.organs.length
		});

		context.textAlign = 'left';
	    context.font = '25px sans-serif';
	    context.fillStyle = 'gray';
		context.fillText(fps, 25, 30);
	}

	else {	// if not ready	
		;
	}

	requestAnimationFrame(run);
}	// end run()

function process(input) {
	mp.directX = input.xdir;
	mp.directY = input.ydir;
	
	var tempOrgans = [];
	for(var i=0; i < mp.organs.length; i++) {
		// each organ will try to move towards the mouse pointer, but later when the orgnas are packed together, they'll follow CM direction
		var xspd = mp.organs[i].xspd;
		var yspd = mp.organs[i].yspd;
		var mag = Math.sqrt(xspd*xspd + yspd*yspd);
		var ang = Math.atan2( (input.ydir+height/2) - (mp.organs[i].y-yshift),			// the direction angle from the organ to the mouse location
							  (input.xdir+width/2)  - (mp.organs[i].x -xshift)  );

		mp.organs[i].xspd = Math.cos(ang) * mag;
		mp.organs[i].yspd = Math.sin(ang) * mag;


		if(input.inType == 'md')	// if this is a mouse click
			tempOrgans.push(mp.organs[i].split());
	}

	for(var i=0; i < tempOrgans.length; i++) 
		mp.organs.push(tempOrgans[i]);
}	// end process()

function drawGrid() {
	var scl = 50;	// the distance between grid lines

	var nHor = Math.floor(width/scl);	// how many vertical lines can we fit in the window
	var nVer = Math.floor(height/scl);	// how many horizontal lines can we fit.

	var offX = width % scl;		// any left over space horizontally
	var offY = height % scl;	// any left over space vertically

	context.beginPath();
	context.strokeStyle = '#99bbff';
	context.lineWidth = 1;

	// draw vertical lines:
	for(var i = 0; i <= nHor; i++){		
		// X % m
		// to extend the domain of X to include negative integers,
		// i came up with this mod function:   ( m + (X%m) ) % m
		// not sure if there's a better way.
		// In our case, X is width + scl - offX,  and  q is (i*scl - xshift)

		// when lines go off the visible area, wrap around
		var m = width + (scl - offX);		// when will the line wrap around?  when it goes off the visible area by scl - offX
		var X = (m + ((i*scl - xshift)% m)) % m; 

		context.moveTo(X, 0);
		context.lineTo(X, height);
	}	
	
	// same procedure for drawing horizontal lines:
	for(var i = 0; i <= nVer; i++) {
		var m = height + scl - offY;
		var Y = (m + ((i*scl - yshift)% m)) % m; 
		
		context.moveTo(0,     Y);
		context.lineTo(width, Y);
	}

	context.stroke();
	context.closePath();
	
}	// end drawGrid();

function generateBlobs() {
	var world_area = wrdWidth*wrdHeight;
	var available_area = world_area;

	var blob_count = (blobDensity * available_area) / blobSize;
	//console.log(blob_count);
	blobs = [];
	for (var i = 0; i < blob_count; i++) {
		blobs.push( new Blob(-(wrdWidth/2) + wrdWidth*Math.random(), -(wrdHeight/2) + wrdHeight*Math.random(), colors[Math.floor((Math.random() * colors.length))]) );
		blobs[i].isVirus = Math.floor(Math.random()*1000)%25 == 1.0;	// make some blobs viruses
	}
}

function drawBlobs() {
	for (var i = 0; i < blobs.length; i++) {
		if(!blobs[i].isVirus)
			drawCircle(blobs[i].x - xshift, blobs[i].y - yshift,
				blobSize, 6, blobs[i].color, blobs[i].ang);
		else
			drawCircle(blobs[i].x - xshift, blobs[i].y - yshift,
				blobSize*6, 17, "Chartreuse", 0);
	}
}

// draw a polygon with given sides and radius(for the circumscribing circle) 
function drawCircle(x,y,rad,sides,col,start) {
	var ang = 2*Math.PI/sides;
	var cur = start;

	context.beginPath();
	context.moveTo(x+ rad*Math.cos(cur), y+rad*Math.sin(cur));
	for(var i=0; i<sides; i++) {
		context.lineTo(x+ rad*Math.cos(cur+ang), y+rad*Math.sin(cur+ang));
		cur += ang;
	}	
	context.closePath();
	context.fillStyle = col;	
	context.fill();
}

// Fps calculation
function initFPS() {
	for(var i=0; i < 10; i++) fps_arr.push(0.0);
}

function calcFPS(now){
	function calAVG() {
		   var count=0.0;
		   for (var i=fps_arr.length; i--;) 
		     count+=fps_arr[i];
		   
		   return Math.round(count/fps_arr.length);
	}

	fps_arr[_ind_%10] = 1000.0/(now-lastTime);
	_ind_++;

	fps = calAVG();
}

}	// end window.onload()

/*************************************************************************************************************************/

/* Helper Functions */

function distSq(x1,y1,x2,y2){
	return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
}

