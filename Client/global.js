/* Blob-related variables */
var blobSize = 12,	// blob radius on screen
	blobDensity = 1.0/1700, //  (blobs_areas) / available_area
 	blobFactor = 20, // how much size increases by eating a blob
 	blobs = [];	// store positions of blobs

/* Other variables */
//var players = [];
var ip_address = "localhost", port = "8080",
    colors = ["magenta", "yellow", "purple", "pink", "chartreuse", "orange", "aqua", "bronze", "red"],
    wrdWidth = 2000*3, wrdHeight = 2000*3,				// world dimensions
    conn,
    inSeq = 0, inBuff = [],
    ease_step = 0.45, ease_spd = 10,
    lastTime, times = 56, ms = 1000.0/times, delta = 0.0,		// for delta-timing and consistent physics
    xshift, yshift,     		// for translating the world to be in main player's perspective
    batch_size = 30,		// how many user inputs to handle and send each frame  TODO: tweak
    fps_arr = [], _ind_ = 0, fps;	// for showing fps

var authState = null;		// the server's authoritative state of the mp. Will be used to overwrite the entirety of mp properties
var pendingInputs = [], prediction = true, reconciliation = true;