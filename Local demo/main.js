/*
	This's a server-independent demo of the game for convenience
*/

// The lingo I'm using:
// blob == food,  organ == cell, size == radius,
// CM == player's center of mass, always at the center of the screen

/* Blob-related variables */
const // blob radius on screen
blobSize = 12;		// for now, this contains food blobs and viruses

const //  (blobs_areas) / available_area
blobDensity = 1.0/2000;

const // how much size increases by eating a blob
blobFactor = 20;

let blobs = [];

/* Other variables */
const colors = ["magenta", "yellow", "purple", "pink", "chartreuse", "orange", "aqua", "bronze", "red"];

const colorPresets = [['#E59E06','#FFB007'],['#91E506','#A2FF07'],['#063ED5','#0745FF'],['#06BBE5','#07D0FF']];
const mpColor = Math.floor(Math.random()*4);
const wrdWidth = 6000;

const // world dimensions
wrdHeight = 6000;

let width;

let //  canvas width and height
height;

const inBuff = [];
const ease_step = 0.45;
const ease_spd = 10;
let t;
let accumulator;
let absoluteTime;

const // timestepping
timestep = 17;

let xshift;

let // for translating the world to be in main player's perspective
yshift;

const // how many user inputs to handle and send each frame  TODO: tweak
batch_size = 30;

let fps;
const fps_arr = [];

let // for showing fps
_ind_ = 0;

const // organ collision slack parameters
slk = {_slk : 0.0, _slk1 : 0.0, _slk2 : 0.0, _slk3 :0.0};

const ripple = {freq: 6, speed: 15, strength: 1.5};
let showPts = false;
let disableClick = false;
const thrustControlRadius = 50 ** 2;

/*************************************************************************************************************************/
class Organ {
    constructor(xpos, ypos, size, xSpd, ySpd, maxSpd) {
        this.lock = false;		// prevent organ from going apart and lock it in place (relative to CM)
        this.x = xpos;
        this.y = ypos;
        this.xspd = xSpd;
        this.yspd = ySpd;
        this.maxspd = maxSpd; 
        this.size = size;
        this.sizeFinal = this.size;	// size will always try to approach sizeFinal. This enables animations. 	
        this.connectedOrgans = [this];	// keep track of touching organs
        this.color = 'red';
        // Easing/interpolation variables
        this.massDelta = 0.0;
        this.applyPosEase = false;
        this.easeDist = 0.0;
        this.easex = 0.0;
        this.easey = 0.0;

        // bounciness effect variables and function
        this.equilibrium = [];	// original surface points at equilibrium
        this.pts = [];		// surface points offseted from equilibrium, but always (should be) contained within the equilibrium surface
        this.ptsCount = 0;		// how many points/sides to use for modeling the organ surface
        this.restoreSpd = 0.0265*150/this.size;	// how fast does pts[] try to reach equilibrium[] 
        this.ang = 0;
        this._var = 0;
        this.time = 0;

        function copyPoint(src) {
            return {
                x: src.x,
                y: src.y,
                r: src.r,
                th: src.th
            };
        }

        this.initPts = function(resetPts) {
            this.equilibrium = [];
            this.ptsCount = 400;	// more points == finer outer shape and bounciness. 
            if(resetPts)
                this.pts = [];

            let ang = 0.0;
            const incr = 2.0*Math.PI/this.ptsCount;

            for (let i = 0; i < this.ptsCount; i++) {
                // user is responsible for making sure polar and cartesian coords of points are matching, for now.
                this.equilibrium[i] = {
                    x:  Math.cos(ang)*this.size,
                    y:  Math.sin(ang)*this.size,	
                    th: ang,			// assert: th is always in [0, 2pi]
                    r: this.size
                };
                if(resetPts)
                    this.pts[i] = copyPoint(this.equilibrium[i]);
                ang += incr;
            }

            //console.log("sides: "+this.ptsCount);
        };

        // the angle of the impact point (from the player's POV), the radius of the arc (in radians) and intensity of the impact 
        this.impact = function(ang, arcTheta, maxPush) {
            arcTheta *= 0.5;

            let hitSpot = {
                x:  Math.cos(ang+Math.PI)*this.size,
                y:  Math.sin(ang+Math.PI)*this.size,
            };

            // determine (index of) the closest point to impact location
            let ind = -1;

            let max = -1;
            for (var i = 0; i < this.pts.length; i++) {
                const dist2 = distSq(this.pts[i].x, this.pts[i].y, hitSpot.x, hitSpot.y);
                if(dist2 > max) {
                    ind = i;
                    max = dist2;
                }
            }

            hitSpot = copyPoint(this.pts[ind]);	// assert ind != -1

            // how many neighboring points in either direction are gonna be affected ?
            // we want an arc of angle theta to be affected on either side of the (new) hitSpot.
            // each point on the arc will be pushed/displaced by some 
            // amount acording to some function of it's proximity to the hitSpot
            for (var i = 0; i < this.pts.length; i++) {
                const curPt = this.pts[(i+ind)%this.pts.length];

                //if(this.equilibrium[(i+ind)%this.pts.length].r - curPt.r < 0.1)
                //		continue;

                // smallest angle between the two points
                let angularDist = Math.abs(curPt.th - hitSpot.th);
                if(angularDist > Math.PI) angularDist = 2*Math.PI - angularDist;

                // if the current point is within the affected arc:
                if(angularDist <= arcTheta) {
                    const prox = Math.abs(1 - angularDist/arcTheta);	// normalize how close curPt to hitSpot is.
                    // the function we'll use for interpolating diplacement according to proximity
                    const f = x => // domain is [0,1]
                    6.0*(x ** 5) - 15.0*(x ** 4) + 10.0*(x ** 3);
                    const displacemntAmt = f(prox)* maxPush;

                    // displace it: 
                    this.pts[(i+ind)%this.pts.length].x = Math.cos(curPt.th)*(curPt.r - displacemntAmt);
                    this.pts[(i+ind)%this.pts.length].y = Math.sin(curPt.th)*(curPt.r - displacemntAmt),
                    this.pts[(i+ind)%this.pts.length].r = curPt.r - displacemntAmt;
                }
            }
        }

        // restore the points closer to equilibrium
        this.restore = function() {	// assumes equilibrim is UPPER bound for pts. if a point ever exceeds its quilibrium limit, it will keep extended to infinity!! 
            for (let i = 0; i < this.pts.length; i++) {
                const diff = Math.abs(this.equilibrium[i].r - this.pts[i].r);
                if( diff > 0.1 ) {
                    // the offest of the point from the equilibrium
                    const dist = Math.sqrt(distSq(this.pts[i].x, this.pts[i].y,	
                         this.equilibrium[i].x, this.equilibrium[i].y));		

                    // move the point closer to equilibrium by a reatio of restoreSpd.
                    const ang = Math.atan2(this.pts[i].y, this.pts[i].x);
                    this.pts[i].x += Math.cos(ang)*dist*this.restoreSpd;
                    this.pts[i].y += Math.sin(ang)*dist*this.restoreSpd;
                    this.pts[i].r = Math.sqrt(distSq(this.pts[i].x, this.pts[i].y, 0,0));
                }
                else {	// snap this point to equilibrium, it's very close to it
                    this.pts[i] = copyPoint(this.equilibrium[i]);
                }			
            }
        }

        this.initPts(true);	// should be called everytime the size changes
    }

    move() {
        this.x += this.xspd;
        this.y += this.yspd;
    }

    easePos(xdir, ydir) {
        this.easex = xdir;
        this.easey = ydir;
        this.easeDist = this.size*17;				// TODO: tweak this
        this.applyPosEase = true;
    }

    split() {
        this.sizeFinal /= 2.0;

        const org2 = new Organ(this.x, this.y, Math.round(this.sizeFinal),
                   this.xspd, this.yspd, this.maxspd);
        const mag = Math.sqrt((org2.xspd*org2.xspd) + (org2.yspd*org2.yspd));
        org2.easePos(org2.xspd/mag, org2.yspd/mag);

        return org2;
    }

    scatter(cx, cy) {
        if(Math.abs(this.size-this.sizeFinal) > 1)	// if the size is being changed (which happens if the organ is already being split/scattered), dont scatter
            return [];

        this.sizeFinal = Math.round(this.sizeFinal);
        this.size = Math.round(this.size);
        this.x = cx;this.y = cy;
        const pcSize = 25.0;
        const peices = Math.floor(this.size/pcSize);

        this.sizeFinal -= pcSize*(peices-1);

        let curAng = Math.random()*Math.PI;
        const incr = 2*Math.PI/(peices-1);
        const newOrgs = [];
        for (let i = 0; i < peices-1; i++) {
            const xdir = Math.cos(curAng);
            const ydir = Math.sin(curAng);
            const org = new Organ(this.x,this.y,pcSize,
                      this.xspd, this.yspd, this.maxspd);
            org.easePos(xdir, ydir);
            newOrgs.push(org);

            curAng += 4*Math.PI*Math.random();
        }

        return newOrgs;
    }

    update() {
        this.restore();
        this.move();

        // TODO: tweak	
        this._var++;
        if(this._var % ripple.speed == 0){
            const steps = 6;
            const dAng = 2*Math.PI/steps;
            for(let i = 0; i < 5; i++){
                this.impact(this.ang, Math.PI/12, 3.25*noise(this.ang/10,this.time)*Math.sqrt(this.size)/(10));
                this.ang += dAng;
            }
            this.time++;
        }

        // I'm using a sloppy lerping hack for projectile motion
        // cuz I'm lazy and I happen to have it lying around.
        // Will switch to forces later.
        let dt = timestep/3500.0;
        if(this.applyPosEase){		// smoothly launch and ease toward distnation if this organ is launching
            this.x += (ease_spd*dt*ease_step*this.easeDist) * this.easex;
            this.y += (ease_spd*dt*ease_step*this.easeDist) * this.easey;
            this.easeDist -= ease_spd*dt*ease_step*this.easeDist;
            if(Math.abs(this.easeDist) <= 0.001)
                this.applyPosEase = false;
        }
        dt = timestep/400.0
        if(Math.abs(this.sizeFinal - this.size) > 0.01){		// smoothly decrease mass if this organ has just been split/scattered
            this.massDelta = this.sizeFinal - this.size;
            const isShrinking = this.massDelta < 0; 
            this.size += ease_spd*dt*this.massDelta*ease_step;
            this.massDelta -= ease_spd*dt*this.massDelta*ease_step;
            if(this.massDelta <= 0.01)
                this.size = Math.round(this.size*10)/10.0;

            this.initPts(isShrinking);		// if the size is shrinking
        }
    }

    draw(context) {
        // draw the organ's main surface by connecting pts[] and filling
        const count = this.ptsCount;
        context.beginPath();
        context.moveTo(this.pts[0].x + this.x - xshift, this.pts[0].y + this.y-yshift);
        for (var i = 0; i < count; i++) {
            context.lineTo(this.pts[(i+1)%count].x +this.x-xshift, this.pts[(i+1)%count].y +this.y-yshift);
        }
        this.color = colorPresets[mpColor];
        context.closePath();
        context.fillStyle = this.color[0];
        context.fill();

        // draw inner surface
        context.save();
        context.translate(this.x-xshift, this.y-yshift);
        const scaler = Math.min(0.7 + 0.1*this.size/50, 0.95);
        context.scale(scaler, scaler);
        context.beginPath();
        context.moveTo(this.pts[0].x, this.pts[0].y);
        for (var i = 0; i < count; i++) {
            context.lineTo(this.pts[(i+1)%count].x, this.pts[(i+1)%count].y);
        }
        context.closePath();
        context.fillStyle = this.color[1];
        context.fill();
        context.restore();

        /*
        context.beginPath();
        context.arc(this.x-xshift,this.y-yshift, this.size, 0,2*Math.PI);
        context.fillStyle = 'rgba(255,0,0,0.2)';
        context.fill();
        context.closePath();
        */	

        // show pts[] ?
        if(showPts) {
            for (var i = 0; i < count; i++) {
                context.beginPath();
                context.arc(this.equilibrium[i].x + this.x - xshift, this.equilibrium[i].y +this.y - yshift, 1, 0,2*Math.PI);
                context.fillStyle = 'red';
                context.fill();
                context.closePath();			
                context.beginPath();
                context.arc(this.pts[i].x + this.x - xshift, this.pts[i].y +this.y - yshift, 1.5, 0,2*Math.PI);
                context.fillStyle = 'green';
                context.fill();
                context.closePath();
            }
        }
        /*
        var name = this.size;
        context.textAlign = 'center';
        context.font = '20px sans-serif';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.strokeText(name, this.x-xshift, this.y-yshift+7);
        context.fillStyle = 'white';
        context.fillText(name, this.x-xshift, this.y-yshift+7);*/
        
    }
}

/************************************************/
class Player {
    constructor() {
        this.organs = []
        this.cmx = 0;		// center of mass (CM), the point equidistant from all organs
        this.cmy = 0;
        this.directX = 0;	// direction in which CM is headed
        this.directY = 0;
    }

    constrain() {	// constrain organs movements
        // after the organs are packed, they can't keep going in their direction, they have to start going in the CM direction
        for(var i = 0; i < this.organs.length; i++) {
            const org = this.organs[i];
            if(org.lock) {
                const mag = Math.sqrt(org.xspd*org.xspd + org.yspd*org.yspd);
                const ang = Math.atan2( this.directY, this.directX);
                org.xspd = Math.cos(ang) * mag;
                org.yspd = Math.sin(ang) * mag;
            }
        }

        // check for collision between mp's organs
        const slack = (slk._slk1 + slk._slk2*Math.sin(slk._slk))*slk._slk3;
        slk._slk += 0.1;
        for(var i = 0; i < this.organs.length-1; i++) {
            const org1 = this.organs[i];
            if(Math.abs(org1.size-org1.sizeFinal) > 1)
                continue;
            for(let j = i+1; j < this.organs.length; j++){
                const org2 = this.organs[j];

                const radSum = (org2.size+org1.size) + slack;		// sum of radii. slack is for separating the two touching organs by some distance. Changing the slack yields nice effect too.
                const distSqr = distSq(org1.x, org1.y, org2.x, org2.y);	// distance between centers squared

                if(radSum ** 2 > distSqr) {
                    // if there's an intersection 

                    const interleave = radSum - Math.sqrt(distSqr);	// how much are the two circles intersecting?  r1 + r2 - distnace

                    // create a vector o12 going from org1 to org2
                    // push the two organs apart, push org2 in the direction of the o12, and org1 in the opposite direction of o12
                    const o12x = org2.x - org1.x;

                    const o12y = org2.y - org1.y;
                    const o12ang = Math.atan2(o12y,o12x);
                    // the exact distnace each one will be pushed(from its original location) is interleave/2
                    org2.x += Math.cos(o12ang) * (interleave/2);
                    org2.y += Math.sin(o12ang) * (interleave/2);
                    org1.x += Math.cos(o12ang) * (-interleave/2);
                    org1.y += Math.sin(o12ang) * (-interleave/2);

                    org1.lock = true;
                    org2.lock = true;

                    // make the two organs connected to each other (touching)
                    let found = false;
                    for(let k =0; k < org1.connectedOrgans.length; k++) {
                        if(org2 === org1.connectedOrgans[k]) {
                            found = true;
                            break;
                        }
                    }
                    if(!found){
                        org1.connectedOrgans.push(org2);
                        org2.connectedOrgans.push(org1);
                    }
                }
             
            }

        }

    }

    calCM() {
        let avgX = 0.0;
        let avgY = 0.0;
        const count = this.organs.length;

        for(let i=0; i < count; i++) {
            avgX += this.organs[i].x;
            avgY += this.organs[i].y;
        }

        this.cmx = avgX/count;
        this.cmy = avgY/count;
    }

    update() {
        // handle collisions
        const peices = [];
        for(var i=0; i<this.organs.length; i++) {
            const collision = detectCollision(this.organs[i]);
            if(collision[0] == 1){	// food blob
                this.organs[i].sizeFinal += 0.5;
                this.organs[i].impact(collision[1], Math.PI/8, 5);	// this makes the organ appear to be  consuming the blob
            }
            else if(collision[0] == 2) {	// virus
                const peicesTemp =  this.organs[i].scatter(this.cmx,this.cmy);
                for (let j = 0; j < peicesTemp.length; j++) {
                    peices.push(peicesTemp[j]);
                }
                break; // TODO: investigate
            }
            else if(collision[0] == 3){
                this.organs[i].impact(collision[1], Math.PI/8, collision[2]);
            }
        }
        for (var i = 0; i < peices.length; i++)
            this.organs.push(peices[i])

        // update
        for(var i=0; i<this.organs.length; i++) 
            this.organs[i].update();
        this.constrain();
        this.calCM();
    }
}


/************************************************/

function Blob (x,y,col) {
	this.x = x;
	this.y = y;
	this.color = col;
	this.ang = Math.random()*Math.PI;
	this.isVirus = false;
}

/*************************************************************************************************************************/

window.onload = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    let mp;		// main player
    let ready = false;
    const infoPan = new InfoPan();		// debug menu
    let dgui;
    window.onresize = event => {
		// update stuff that depend on the window size.... 
		// I know so sloppy.... will look into stuff like bootstrap later. Baby steps XD
	    width = canvas.width = window.innerWidth;
		height = canvas.height = window.innerHeight;
	    infoPan.refresh();
	};
    window.onkeyup = e => {
	    let key = e.keyCode ? e.keyCode : e.which;
	    if(key == 80) 
	       showPts = !showPts;
	    if(key = 68)
	       disableClick = !disableClick;
	};

    init();

    function init(){
        generateBlobs();	
        initFPS();

        // initilaize player's properties
        mp = new Player();
        mp.organs.push(new Organ(0, 0, 151, 1, 0,8));  
        mp.cmx = mp.organs[0].x;						
        mp.cmy = mp.organs[0].y; 

        addEventListeners();
        infoPan.show();	
        dgui = new dat.GUI({ autoPlace: false });
        document.getElementById("info").appendChild(dgui.domElement);
        dgui.add(ripple,"freq",1,25);
        dgui.add(ripple,"strength",0.0,3.0);

        t = 0;
        accumulator = 0.0;
        absoluteTime = performance.now();
        ready = true;
        run(); // Start gameplay
    }

    function addEventListeners(){
        // mouse click to fire
        document.body.addEventListener("mousemove", event => {
            inBuff.push({	
                xdir : event.clientX-(width/2.0),
                ydir : event.clientY-(height/2.0),
                inType : "mm"
            });
        });

        document.body.addEventListener("mousedown", event => {
            console.log(disableClick);
            inBuff.push({	
                xdir : event.clientX-(width/2.0),
                ydir : event.clientY-(height/2.0),
                inType : "md"
            });
        });
    }

    function run() {		// Main game-loop function
        if(ready) {
            handleInput();

            // Fixed timestep: courtesy of Glenn Fiedler of gafferongames.com
            const newTime = performance.now()*1.0;
            calcFPS(newTime);
            const deltaTime = newTime - absoluteTime;
            //if(deltaTime > 200) deltaTime = timestep;
            if(deltaTime > 0.0)	{
                absoluteTime = newTime;
                accumulator += deltaTime;
                while(accumulator >= timestep) {		
                    mp.update();
                    accumulator -= timestep;
                    t++;					
                }
            }

            context.clearRect(0, 0, width, height);
            xshift = mp.cmx - width/2;
            yshift = mp.cmy - height/2; 
            drawGrid();
            drawBlobs();

            for(let i=0; i<mp.organs.length; i++) 
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

    function handleInput(){
        // grab a bunch of inputs, average em and apply the result
        let avgX = avgY = 0.0;
        let type = 'mm';
        let batchSize = batch_size;
        while(batchSize > 0 && inBuff.length>0) {
            const input = inBuff.shift();			// shift() removes the first element.... as in Queues
            avgX += input.xdir;
            avgY += input.ydir;

            if(input.inType == 'md')
                type = 'md';
            batchSize--;
        }

        let result = null;
        if(batch_size - batchSize != 0) {	//  (batch_size - batchSize) is the number of inputs the while went over
            result = {
                xdir: avgX/(batch_size - batchSize),
                ydir: avgY/(batch_size - batchSize),
                inType: type
            };
            applyInput(result);
        }
    }

    function applyInput(input) {
        mp.directX = input.xdir;
        mp.directY = input.ydir;

        const tempOrgans = [];
        for(var i=0; i < mp.organs.length; i++) {
            // each orgnas will try to move towards the mouse pointer, but later when the organs are packed together, they'll follow CM direction

            const //orgDirx = input.ydir - mp.organs[i].y + mp.cmy,
            //orgDiry = input.xdir - mp.organs[i].x + mp.cmx,
            ang = Math.atan2(input.ydir - mp.organs[i].y + mp.cmy, input.xdir - mp.organs[i].x + mp.cmx);		// the direction angle from the organ to the mouse location
                   
            
            // get the average center and radius (circle) of the connected group of this organ. The goal is to apply the same thrust to all connected components so they move in uniform as a whole
            const group = {x:0, y:0, r:0};
            for (let j = 0; j < mp.organs[i].connectedOrgans.length; j++) {
                group.x +=  mp.organs[i].connectedOrgans[j].x;
                group.y +=  mp.organs[i].connectedOrgans[j].y;
                group.r +=  mp.organs[i].connectedOrgans[j].size;
            }
            group.x /= mp.organs[i].connectedOrgans.length;
            group.y /= mp.organs[i].connectedOrgans.length;
            group.r /= mp.organs[i].connectedOrgans.length;

            // use the circle we calculated to calculate thrust
            group.x = input.xdir - group.x + mp.cmx;
            group.y = input.ydir - group.y + mp.cmy;
            const thrustRadSq = group.r ** 2;	
                thrust = Math.min(thrustRadSq, group.x*group.x + group.y*group.y) / thrustRadSq;		// in the interval [0,1], how fast the player is moving? 1 means full speed
            
            mp.organs[i].xspd = Math.cos(ang) * mp.organs[i].maxspd * thrust;
            mp.organs[i].yspd = Math.sin(ang) * mp.organs[i].maxspd * thrust;
        
            if(input.inType == 'md')
                tempOrgans.push(mp.organs[i].split());
        }

        for(var i=0; i < tempOrgans.length; i++)
            mp.organs.push(tempOrgans[i]);
    }

    function drawGrid() {
        const scl = 50;	// the distance between grid lines

        const nHor = Math.floor(width/scl);	// how many vertical lines can we fit in the window
        const nVer = Math.floor(height/scl);	// how many horizontal lines can we fit.

        const offX = width % scl;		// any left over space horizontally
        const offY = height % scl;	// any left over space vertically

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
            const X = (m + ((i*scl - xshift)% m)) % m; 

            context.moveTo(X, 0);
            context.lineTo(X, height);
        }	
        
        // same procedure for drawing horizontal lines:
        for(var i = 0; i <= nVer; i++) {
            var m = height + scl - offY;
            const Y = (m + ((i*scl - yshift)% m)) % m; 
            
            context.moveTo(0,     Y);
            context.lineTo(width, Y);
        }

        context.stroke();
        context.closePath();
        
    }	// end drawGrid();

    function generateBlobs() {
        const world_area = wrdWidth*wrdHeight;
        const available_area = world_area;

        const blob_count = (blobDensity * available_area) / blobSize;
        //console.log(blob_count);
        blobs = [];
        for (let i = 0; i < blob_count; i++) {
            blobs.push( new Blob(-(wrdWidth/2) + wrdWidth*Math.random(), -(wrdHeight/2) + wrdHeight*Math.random(), colors[Math.floor((Math.random() * colors.length))]) );
            blobs[i].isVirus = Math.random()<0.01;	// make some blobs viruses
            blobs[i].r = blobs[i].isVirus?  100:blobSize
        }
    }

    function drawBlobs() {
        for (let i = 0; i < blobs.length; i++) {
            if(!blobs[i].isVirus)
            drawCircle(blobs[i].x - xshift, blobs[i].y - yshift,
                    blobs[i].r, 7, blobs[i].color, blobs[i].ang);
            else
            drawVirus(blobs[i].x - xshift, blobs[i].y - yshift,
                    blobs[i].r, 0);
        }
    }

    // draw a polygon with given sides and radius(for the circumscribing circle)
    function drawCircle(x,y,rad,sides,col,start) {
        const ang = 2*Math.PI/sides;
        let cur = start;

        context.beginPath();
        context.moveTo(x+ rad*Math.cos(cur), y+rad*Math.sin(cur));
        for(let i=0; i<sides; i++) {
            context.lineTo(x+ rad*Math.cos(cur+ang), y+rad*Math.sin(cur+ang));
            cur += ang;
        }
        context.closePath();
        context.fillStyle = col;
        context.fill();
    }

    function drawVirus(x,y,rad,start){
        const virusTipLength = 7.0;
        let tips = rad/2.0;
            if(Math.floor(tips)%2==0) tips = Math.floor(tips);
            else tips = Math.ceil(tips);
        
        const sides = 2*tips;
        const ang = 2*Math.PI/sides;
        let cur = start;
        context.beginPath();
        context.moveTo(x+ rad*Math.cos(cur), y+rad*Math.sin(cur));
        for(let i=0; i<sides; i++) {
            const mag = (i%2==0) ? rad - virusTipLength : rad;
            context.lineTo(x+ mag*Math.cos(cur+ang), y+ mag*Math.sin(cur+ang));
            cur += ang;
        }
        context.closePath();
        context.fillStyle = '#33FF33';
        context.fill();
    }

    // Fps calculation
    function initFPS() {
        for(let i=0; i < 10; i++) fps_arr.push(0.0);
    }

    function calcFPS(now) {
        function calAVG(){
            let count=0.0;
            for (let i=fps_arr.length; i--;) 
              count+=fps_arr[i];
            return Math.round(count/fps_arr.length);
        }
        fps_arr[_ind_%10] = 1000.0/(now-absoluteTime);
        _ind_++;
        fps = calAVG();
    }
}	// end window.onload()

/*************************************************************************************************************************/

/* Helper Functions */

function distSq(x1,y1,x2,y2){
	return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
}

function detectCollision(org){
	/*
		return [case, hit angle, extent of intersection]

		cases:
			-1 no intersection
			1 consume food
			2 consume virus
			3 intersection, no consumption
	*/

	for (let i = 0; i < blobs.length; i++) {
			const radSum = (org.sizeFinal + blobs[i].r);		
			const distSqr = distSq(org.x, org.y, blobs[i].x, blobs[i].y);	

			if(radSum ** 2 > distSqr) {  // intersection
				const hitAng = Math.atan2(blobs[i].y - org.y, blobs[i].x - org.x);

				if(distSqr <= org.sizeFinal*org.sizeFinal)	{ // if the center is within the organ, consume the blob
					if(!blobs[i].isVirus){
						blobs.splice(i,1);
						return [1, hitAng, 1.0];			
					}
					else if(org.sizeFinal - blobs[i].r > 5)	{	// give some extra slack before the virus is consumed
						blobs.splice(i,1);
						return [2, hitAng, 1.0];			
					}
				}

				const interleave = radSum - Math.sqrt(distSqr);
				return [3,hitAng, 1- interleave/blobs[i].r];
			}
	}
	return [-1,null,null];	
}
