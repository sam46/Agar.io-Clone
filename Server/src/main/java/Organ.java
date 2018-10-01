
/******************************************************
	The player can have many organs
*******************************************************/

public class Organ extends GameObj {
	//Player properties:  (shared between all organs of the player)
	public int owner;				// the pid of the player owning this organ
	public int lastAck = -1;		// last acknowledged/processed input
	public Vector mpDirect;			// player's direction
	public Vector  mpCM;			// player's CM

	// Organ properties:
	public boolean lock = false;
	/* Easing variables */
	private static final double ease_step = 0.45, ease_spd = 10;		// control the speed of the easing and how many frames it takes to finish
	private double easeDist,			// how far will the organ go when launched
				  massDelta;		// how much will the increase/decrease in size be. could be + or -
	private Vector easeVec;			// in which direction will the organ launch
	public boolean applyPosEase = false;

	public Organ(int pid, double x, double y, double size, double xspd, double yspd) {
		this.owner = pid;
		this.pos = new Vector(0,0, x, y);
		this.vel = new Vector(0,0, xspd, yspd);
		this.mpCM = new Vector(0,0, x, y);
		this.mpDirect = new Vector(0,0, 0,0);
		this.size = size;
		this.sizeFinal = size;
		this.easeVec = new Vector(0,0,0,0);
	}
	
	public void easePos(Vector easeVec){			// give this organ launch speed which will smoothly affect its pos over many frames
		//easeVec = new Vector(ang, 1.0f);	// unit direction vector
		this.easeVec = easeVec;
		easeDist = size*20;				// TODO: tweak this
		applyPosEase = true;
	}

	public void update(){
		move();

		double dt = GameDs.timestep/3500.0;
		if(applyPosEase){	
			pos.add(ease_spd*dt*easeVec.x*ease_step*easeDist, ease_spd*dt*easeVec.y*ease_step*easeDist);
			easeDist -= ease_spd*dt*ease_step*easeDist;
			if(Math.abs(easeDist) <= 0.001) {
				applyPosEase = false;
				//lock = true;
			}
		}

		dt = GameDs.timestep/400.0;
		if(Math.abs(this.sizeFinal - this.size) > 0.01){		// smoothly decrease mass if this organ has just been split/scattered
			this.massDelta = this.sizeFinal - this.size;
			//var isShrinking = this.massDelta < 0;
			this.size += ease_spd*dt*this.massDelta*ease_step;
			this.massDelta -= ease_spd*dt*this.massDelta*ease_step;
			if(Math.abs(this.massDelta) <= 0.01)
				this.size = Math.round(this.size*10)/10.0;

			//this.initPts(isShrinking);		// if the size is shrinking
		}
	}
	
	public void move() {
		pos.add(vel.x, vel.y);
		if(Double.isNaN(pos.x) || Double.isNaN(pos.y)){
			System.out.println("WARNING pos is NaN");
		}

		//teleport to the other side if beyond world space
		//if(pos.x>3000) pos.x = -3000;
		//else if (pos.x<-3000) pos.x = 3000;
		//if(pos.y>3000) pos.y = -3000;
		//else if (pos.y<-3000) pos.y = 3000;
	}

	public Organ split(){
		this.sizeFinal /= 2.0;

		Organ org2 = new Organ(this.owner, this.pos.x, this.pos.y, Math.round(this.sizeFinal),
				this.vel.x, this.vel.y);
		double mag = Math.sqrt((org2.vel.x*org2.vel.x) + (org2.vel.y*org2.vel.y));
		org2.easePos(new Vector(0,0, org2.vel.x/mag, org2.vel.y/mag));

		org2.lastAck = this.lastAck;
		return org2;
	}

	static String format(double dbl){
		return String.valueOf(  Math.round(dbl*100)/100.0   );
	}

	// TODO: implement this functionality with a better de/serialization mechanism
	public String getData(boolean appendPlayerProperties) {
		String str = "";
		if(appendPlayerProperties)
			str +=  ","+owner+","						// 12
				+format(mpDirect.x)+","				// 13
				+format(mpDirect.y)+"," 			// 14
				+format(mpCM.x)+","					// 15
				+format(mpCM.y)+","					// 16
				+lastAck;							// 17

		return   format(pos.x)+","					// 0
				+format(pos.y)+","					// 1
				+format(size )+ ","					// 2
				+format(vel.x)+","					// 3
				+format(vel.y)+","					// 4
				+(lock ? "1":"0")+","				// 5
				+(applyPosEase ? "1":"0")+","		// 6
				+format(sizeFinal)+","	 			// 7
				+format(massDelta)+","				// 8
				+format(easeDist)+","				// 9
				+format(easeVec.x)+","				// 10
				+format(easeVec.y)+				// 11
				str;
	}
	
}
