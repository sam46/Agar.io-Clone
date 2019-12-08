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
    let ready = false;

    const mp = new Player(-1);		// main player
    //var wheel = 0;
    let frame = 1;
    const infoPan = new InfoPan();
    const spanel = document.getElementById("start-panel");
    const spanel_style = window.getComputedStyle(spanel);
    const spanelWstr = spanel_style.getPropertyValue("width");
    const spanelHstr = spanel_style.getPropertyValue("height");
    const spanelW = parseInt(spanelWstr.substr(0, spanelWstr.length-2));
    const spanelH = parseInt(spanelHstr.substr(0, spanelHstr.length-2));
    const spanel_col = 20;
    spanel.style.top = `${(height-spanelH)/2}px`;
    spanel.style.left = `${(width-spanelW)/2}px`;

    if ("WebSocket" in window) console.log("WebSockets Supported.");
    else console.log("Browser doesn't support WebSockets");

    generateBlobs();
    Connect();
    initFPS();

    run();

    window.onresize = event => {
		// update stuff that depend on the window size
	    width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
	    infoPan.refresh();
	};


    function Connect(){
        conn = new WebSocket(`ws://${ip_address}:${port}`);
        conn.onopen = e => {
            console.log("Connected to server");
            addEventListeners();
        };

        let fst_msg = true;
        conn.onmessage = e => {

            // if this is the first msg:
            if(fst_msg) {	// first message will contain data only meant for mp
                const init_data = String(e.data).split(',');
                mp.pid = parseInt(init_data[0]);
                mp.organs.push(new Organ(1,1,parseFloat(init_data[3]),1,1,1));
                mp.organs[0].x = parseFloat(init_data[1]);
                mp.organs[0].y = parseFloat(init_data[2]);
                mp.organs[0].size = parseFloat(init_data[3]);
                mp.organs[0].sizeFinal = parseFloat(init_data[4]);
                mp.organs[0].xspd = parseFloat(init_data[5]);
                mp.organs[0].yspd = parseFloat(init_data[6]);
                mp.organs[0].maxspd = Math.sqrt(mp.organs[0].xspd*mp.organs[0].xspd + mp.organs[0].yspd*mp.organs[0].yspd);
                mp.cmx = mp.organs[0].x;
                mp.cmy = mp.organs[0].y;

                authStateBackup  = new Player(-1);
                copyPlayer(mp, authStateBackup);

                fst_msg = false;
                spanel.style.display = "none";
                infoPan.show();

                t = 0;
                accumulator = 0.0;
                absoluteTime = performance.now();
                ready = true;

                return;
            }

            // messages from now on will contain all organs present on the server, so filtering is required.
            
            // authState has the same properties as mp. A state is almost a Player() object more or less.
            // We'll fill the authState with the data we recieved
            // TODO: implement this functionality with a better de/serialization mechanism
            authState = null;
            authState = new Object();
            authState.organs = [];
            const op = [];		// store other players' states

            const AllOrgs = String(e.data).split(';');		// organs/players are separated by ';'

            // scan the message organ by organ. Organs belonging to the same player come in one row. we'll know we've hit a new player when the organ has more data
            let curPlayerId;
            for (var i=0; i < AllOrgs.length; i++) { 		// for each organ in the server's message:
                // player/organs' properties are separated by ','
                const orgData = AllOrgs[i].split(',');

                if(orgData.length == 18)	// if this is the first organ for the current player:
                    curPlayerId = parseInt(orgData[12]);	

                // construct the organ object from the data recieved
                const curOrg = new Organ( parseFloat(orgData[0]),
                    parseFloat(orgData[1]),
                    parseFloat(orgData[2]),
                    parseFloat(orgData[3]),
                    parseFloat(orgData[4]),
                    Math.sqrt(parseFloat(orgData[3])*parseFloat(orgData[3]) + parseFloat(orgData[4])*parseFloat(orgData[4]))
                );
                curOrg.lock =  parseInt(orgData[5]) ? true : false;
                curOrg.applyPosEase = parseInt(orgData[6]) ? true : false;
                curOrg.sizeFinal = parseFloat(orgData[7]);
                curOrg.massDelta = parseFloat(orgData[8]);
                curOrg.easeDist = parseFloat(orgData[9]);
                curOrg.easex = parseFloat(orgData[10]);
                curOrg.easey = parseFloat(orgData[11]);

                // if this organ is mp's
                if(mp.pid == curPlayerId) {
                    // we'll put the data meant for mp in authState
                    //console.log('ok');
                    authState.organs.push(curOrg);

                    if(orgData.length == 18) {	// if this is the first organ for the current player, use the additional data it has
                        authState.pid = curPlayerId;
                        authState.directX = parseFloat(orgData[13]);
                        authState.directY = parseFloat(orgData[14]);
                        authState.cmx = parseFloat(orgData[15]);
                        authState.cmy = parseFloat(orgData[16]);
                        authState.seq = parseInt(orgData[17]);
                    }
                }

                ///////// if this organ is not mp's: \\\\\\\\\\
                else {
                    let owner = null;

                    // figure out which player this data is meant for
                    for (let j = 0; j < op.length; j++) {
                        if(op[j].pid == curPlayerId) {
                            owner = op[j];
                            break;
                        }
                    }

                    if(owner == null) {	// if this organ/data doesnt belong to any player in op[], create a new player and give it to him
                        owner = new Player(curPlayerId);
                        op.push(owner);
                    }

                    owner.organs.push(curOrg);	
                    if(orgData.length == 18) { // if the organ has the additional data appended to it:
                        owner.directX = parseFloat(orgData[13]);
                        owner.directY = parseFloat(orgData[14]);
                        owner.cmx = parseFloat(orgData[15]);
                        owner.cmy = parseFloat(orgData[16]);
                        owner.seq = parseInt(orgData[17]);
                    }

                }

            }

            // update opStates[] using the freshly constructed op[]
            for (var i = 0; i < op.length; i++) {
                const cur = op[i];
                cur.timestamp = performance.now();	// attach a timestamp to this state

                if(cur.pid in opStates) {	// if this player already has a record in opStates[] 
                    
                    opStates[cur.pid].push(cur);

                    if(opStates[cur.pid].length > 2) //statesPerPlayer)	// if after adding this state there're more states than is allowed per player, get rid of the oldest state
                        opStates[cur.pid].splice(0,1);	
                }
                else {	// never-seen-before player
                    opStates[cur.pid] = []; // make a new sarray to hold his states
                    opStates[cur.pid].push(cur);
                }

            }

        };	// end onmessage() ;

        conn.onclose = e => {
            ready = false;
            //setTimeout(Connect, 5000);
        };

        function addEventListeners(){

            document.body.addEventListener("mousemove", event => {
                inBuff.push({
                    seq : inSeq,
                    xdir : event.clientX-(width/2.0),
                    ydir : event.clientY-(height/2.0),
                    inType : "mm"
                });
                inSeq++;
            });

            document.body.addEventListener("mousedown", event => {
                inBuff.push({
                    seq : inSeq,
                    xdir : event.clientX-(width/2.0),
                    ydir : event.clientY-(height/2.0),
                    inType : "md"
                });
                inSeq++;
            });

            // document.body.addEventListener("wheel", function(WheelEvent) {
            // 	wheel += -WheelEvent.deltaY/100;
            // 	amtConst += wheel*0.05;
            // 	amtConst = Math.max(0,amtConst);
            // 	amtConst = Math.min(amtConst,1);
            // 	console.log(amtConst);
            // });

            window.onkeyup = e => {
                const key = e.keyCode ? e.keyCode : e.which;
                if (key == 73) 
                    showServer = !showServer;
                else if (key == 80) 
                    showPts = !showPts;
                else if (key == 79) 
                    showName = !showName; 
            };
        }
    }	// end connect()

    function send(input) {
        if(input)
            conn.send(`${input.inType},${input.xdir},${input.ydir},${input.seq}`);
    }

    function processServerMsg() {	
        if(authState == null) return false;
        // Overwrite mp's state by the authState we got from the server.
        // The state includes all mp's properties and his organs' properties as well
         
        copyPlayer(authState, mp);

        // Re-apply all inputs/physics not processed by server yet
        if(reconciliation) {
            let i = 0;
            while (i < pendingInputs.length) {
                const input = pendingInputs[i];

                if (input.seq <= authState.seq) {
                  // Already processed. Its effect is already taken into account into the world update we got from server, so we can drop it.
                  pendingInputs.splice(i, 1);
                } else {
                  // Not processed by the server yet. Re-apply it.
                  applyInput(input);
                  i++;
                }
            }

            if(predictedState != null)		// reconciliation for physics/state
                copyPlayer(predictedState, mp, true);
        }

        else {		// if we're not reconciling, drop all stored inputs cuz we dont need them
            pendingInput = [];
        }

        // save the server's state for later rendering of server output
        authStateBackup = new Player(-1);  copyPlayer(authState, authStateBackup);	

        predictedState = null;
        authState = null;
        return true;
    }

    const frameNum = 0;

    function run() {		// Main game-loop function
        if(ready) {
            const recievedState = processServerMsg();		// Set mp's state according to server's authoritative msg. Also do reconciliation if enabled.
            const otherPlayersInterpolated = [];
            let batchSize = batch_size; // multiple mouse inputs could be coming in a frame, so we have to process multiple per frame.
            while(batchSize-- > 0 && inBuff.length > 0) {
                const input = inBuff.shift();			// shift() removes the first element... thus inBuffs functions as a queue
                send(input);
                pendingInputs.push(input);			// store inputs sent to server for later reconciliation
                if(prediction) applyInput(input);	// client-prediction for input
            }

            // Fixed timestep: courtesy of Glenn Fiedler of gafferongames.com
            const newTime = performance.now()*1.0;
            calcFPS(newTime);
            const deltaTime = newTime - absoluteTime;

            if(deltaTime > 0.0)	{
                absoluteTime = newTime;
                accumulator += deltaTime;

                while(accumulator >= timestep) {		
                    if(prediction) 	mp.update(); // client-prediction for physics/state

                    accumulator -= timestep;
                    t++;					
                }


                // interpolate other players' positions, save the resulting player in otherPlayersInterpolated to draw them later
                for(i in opStates) { // foreach other-player
                    // pick the most two recent states recieved from server.
                    // figure out where exactly the (delayed) current time falls within the time of the two states.
                    // interpolate and store the result.
                    const curPlayerStates = opStates[i];
                    let result;
                    if(curPlayerStates.length == 2) {	
                        const diff = 100;	// server message-send interval
                        let progress =  (performance.now() - curPlayerStates[0].timestamp - diff)/ (curPlayerStates[1].timestamp - curPlayerStates[0].timestamp);
                        progress = Math.min(progress,1.0);
                        result = Player.interpolate(curPlayerStates[0],curPlayerStates[1], progress);
                    }
                    else	// if we havent received enough states for interpolation, just render the one we have
                        result = curPlayerStates[0];
                    
                    otherPlayersInterpolated.push(result);
                }	
                
            }

            // save the state after prediction for later reconiliation 
            if(prediction) {
                predictedState = new Player(mp.pid);
                copyPlayer(mp, predictedState, true);
            }
            
            /****** Rendering ******/
            context.clearRect(0, 0, width, height);
            xshift = mp.cmx - width/2;
            yshift = mp.cmy - height/2;
            drawGrid();
            drawBlobs();

            // draw main player
            for(var i=0; i<mp.organs.length; i++)
                mp.organs[i].draw(context, "Player");

            // draw other player
            for (var i = 0; i < otherPlayersInterpolated.length; i++) {
                for (let j = 0; j < otherPlayersInterpolated[i].organs.length; j++) 
                    otherPlayersInterpolated[i].organs[j].draw(context, "other");
            }

            // draw server
            if(showServer)
                for(var i=0; i<authStateBackup.organs.length; i++) // draw the server's
                    authStateBackup.organs[i].draw(context, "Server",true);
            
            // draw info on the panel
            const data = {
                cmx1: authStateBackup.cmx,
                cmx2: mp.cmx,
                cmy1: authStateBackup.cmy,
                cmy2: mp.cmy,
                frm: frame++
            };
            infoPan.updateData(data);

            context.textAlign = 'left';
            context.font = '25px sans-serif';
            context.fillStyle = 'gray';
            context.fillText(fps, 25, 30);
        }

        else {	// if not ready
            context.fillStyle = '#333333';
            context.fillRect(0, 0, width, height);

            context.textAlign = 'center';
            context.fillStyle = '#FFFFFF';
            context.font = 'bold 30px sans-serif';
            context.fillText('Connecting to server...', width/2, height/2);
            spanel.style.display = "block";
        }

        requestAnimationFrame(run);
    }	// end run()

    function applyInput(input) {
        mp.directX = input.xdir;
        mp.directY = input.ydir;
        let thrust = Math.min(thrustControlRadius,input.xdir*input.xdir + input.ydir*input.ydir) / thrustControlRadius;	// in the interval [0,1], how fast the player is moving? 1 means full speed

        const tempOrgans = [];
        for(var i=0; i < mp.organs.length; i++) {
            // each orgnas will try to move towards the mouse pointer, but later when the organs are packed together, they'll follow CM direction

            const ang = Math.atan2( input.ydir - mp.organs[i].y + mp.cmy,			// the direction angle from the organ to the mouse location
                                  input.xdir - mp.organs[i].x + mp.cmx  );
            
            //if(distSq(mp.organs[i].x, mp.organs[i].y, mp.cmx, mp.cmy) >= 500) 
                thrust = 1;
            mp.organs[i].xspd = Math.cos(ang) * mp.organs[i].maxspd * thrust;
            mp.organs[i].yspd = Math.sin(ang) * mp.organs[i].maxspd * thrust;

            if(input.inType == 'md')
                tempOrgans.push(mp.organs[i].split());
        }

        for(var i=0; i < tempOrgans.length; i++)
            mp.organs.push(tempOrgans[i]);

    }	// end process()

    function drawGrid() {
        /*var maxX = wrdWidth/2, maxY = wrdHeight/2;
        var ulx = 2 -xshift -maxX,			// upleft
            uly = 2 -yshift- maxY,
            urx = wrdWidth -xshift-maxX,	// upright
            ury = 2 -yshift-maxY,
            dlx = 2 -xshift-maxX,			// downleft
            dly = wrdHeight -yshift-maxY,
            drx = wrdWidth -xshift-maxX,	// downright
            dry = wrdHeight -yshift-maxY;
        context.beginPath();
        context.moveTo(ulx,uly);
        context.lineTo(dlx,dly);
        context.stroke();
        context.beginPath();
        context.moveTo(ulx,uly);
        context.lineTo(urx,ury);
        context.stroke();
        context.beginPath();
        context.moveTo(urx,ury);
        context.lineTo(drx,dry);
        context.stroke();
        context.beginPath();
        context.moveTo(drx,dry);
        context.lineTo(dlx,dly);
        context.stroke();
    */

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
        const available_area = world_area;// - size;
        /* blob_count * blobSize / available_area = density  */
        const blob_count = (blobDensity * available_area) / blobSize;
        //console.log(blob_count);
        blobs = [];
        for (let i = 0; i < blob_count; i++) {
            blobs.push( new Blob(-(wrdWidth/2) + wrdWidth*Math.random(), -(wrdHeight/2) + wrdHeight*Math.random(), colors[Math.floor((Math.random() * colors.length))]) );
            blobs[i].isVirus = Math.floor(Math.random()*1000)%25 == 1.0;	// make some blobs viruses
        }
    }

    function drawBlobs() {
        for (let i = 0; i < blobs.length; i++) {
            if(!blobs[i].isVirus)
            drawCircle(blobs[i].x - xshift, blobs[i].y - yshift,
                    blobSize, 6, blobs[i].color, blobs[i].ang);
            else
            drawVirus(blobs[i].x - xshift, blobs[i].y - yshift,
                    100, 0);
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
        context.fillStyle = "Chartreuse";
        context.fill();
    }

    function initFPS() {
        for(let i=0; i < 10; i++) fps_arr.push(0.0);
    }

    function calcFPS(now){
        function calAVG() {
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

/*

function sizeToSpd(sz) {
		return sz/10;
}

function compUV(ux,uy,vx,vy){		// component of u along v
	var udotv = ux*vx + uy*vy;
	var vdotv = vx*vx + vy*vy;
	var scaler = udotv/vdotv;
	return {
		xcomp : vx*scaler,
		ycomp : vy*scaler
	};
}


	function showPanel() {
		if(ready) panel.style.display = "none";
		//panel.style.background = "rgba("+panel_col+","+panel_col+","+panel_col+", 0.85)";
		else panel.style.display = "block";
	}

	window.onkeyup = function(e) {
	   var key = e.keyCode ? e.keyCode : e.which;
	   if (key == 83) {
	       ;
	   }
	}

*/
