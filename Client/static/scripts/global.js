/* Blob-related variables */
let blobSize = 12,	// blob radius on screen
	blobDensity = 1.0/1700, //  (blobs_areas) / available_area
 	blobFactor = 20, // how much size increases by eating a blob
 	blobs = [];	// store positions of blobs

/* Other variables */

let ip_address = "localhost", port = "8080", conn,
    colors = ["magenta", "yellow", "purple", "pink", "chartreuse", "orange", "aqua", "bronze", "red"],
    wrdWidth = 2000*3, wrdHeight = 2000*3,				// world dimensions
    width,height,                           //  window width and height
    inSeq = 0, inBuff = [],     
    ease_step = 0.45, ease_spd = 10,
    t, accumulator, absoluteTime, timestep = 17,        // timestepping
    xshift, yshift,     	      // for translating the world to be in main player's perspective
    batch_size = 30,		      // how many user inputs to handle and send each frame  TODO: tweak
    fps_arr = [], _ind_ = 0, fps;	// for showing fps

let authState = null,           // the server's authoritative raw state of the mp
    predictedState = null;		
    pendingInputs = []
    prediction = true, reconciliation = true,       
    authStateBackup = null,       // for rendering raw server output
    opStates = {}, statesPerPlayer = 3;    // other players

let slk = {_slk : 0.0, _slk1 : 0.0, _slk2 : 0.0, _slk3 :0.0},           // organ collision slack parameters
    ripple = {freq: 6, speed: 15, strength: 2.0},
    showName = true, showServer = true, showPts = false;