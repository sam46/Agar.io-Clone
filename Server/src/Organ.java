
/******************************************************
	The player can have many organs
*******************************************************/

public class Organ extends GameObj {
	public int lastAck = -1;		// last acknowledged/processed input
	public int owner;				// the pid of the player owning this organ
	public boolean lock = false;
	public Vector mpDirect;			// player's direction
	public Vector  mpCM;			// player's CM
	/* Easing variables */
	private static final double ease_step = 0.45, ease_spd = 10;		// control the speed of the easing and how many frames it takes to finish
	private double easeDist,			// how far will the organ go when launched
				  massDelta;		// how much will the increase/decrease in size be. could be + or -
	private Vector easeVec;			// in which direction will the organ launch
	public boolean applyPosEase = false, applySizeEase = false;

	public Organ(int pid, double x, double y, double size, double xspd, double yspd) {
		this.owner = pid;
		this.pos = new Vector(0,0, x, y);
		this.vel = new Vector(0,0, xspd, yspd);
		this.mpCM = new Vector(0,0, x, y);
		this.mpDirect = new Vector(0,0, 0,0);
		this.size = size;
		this.easeVec = new Vector(0,0,0,0);
	}
	
	@Override
	public void absorb(GameObj small){
		
	}

	@Override
	public void consume(GameObj big) {

	}
	
	public void easePos(Vector easeVec){			// give this organ launch speed which will smoothly affect its pos over many frames
		//easeVec = new Vector(ang, 1.0f);	// unit direction vector
		this.easeVec = easeVec;
		easeDist = size*20;				// TODO: tweak this
		applyPosEase = true;
	}

	public void easeSize(double massDelta){		// smoothly change this organ's size by massDelta over many frames
		this.massDelta = massDelta; 	
		applySizeEase = true;
	}
	
	public void update(){
		double dt = GameDs.timestep/1000;

		move();
		if(applyPosEase){	
			pos.add(ease_spd*dt*easeVec.x*ease_step*easeDist, ease_spd*dt*easeVec.y*ease_step*easeDist);
			easeDist -= ease_spd*dt*ease_step*easeDist;
			if(Math.abs(easeDist) <= 0.001) {
				applyPosEase = false;
				//lock = true;
			}
		}
		
		if(applySizeEase){
			size += ease_spd*dt*massDelta*ease_step;
			massDelta -= ease_spd*dt*massDelta*ease_step;
			if(Math.abs(massDelta) <= 0.001)
				applySizeEase = false;
		}
	}
	
	public void move() {
		pos.add(vel.x, vel.y);
		if(Double.isNaN(pos.x) || Double.isNaN(pos.y)){
			pos.print();
			vel.print();
			System.out.println("-----------------------------");
		}

		//teleport to the other side if beyond world space
		//if(pos.x>3000) pos.x = -3000;
		//else if (pos.x<-3000) pos.x = 3000;
		//if(pos.y>3000) pos.y = -3000;
		//else if (pos.y<-3000) pos.y = 3000;
	}

	public Organ split(){
		this.easeSize(-this.size/2.0);

		Organ org2 = new Organ(this.owner, this.pos.x, this.pos.y, this.size/2,
				this.vel.x, this.vel.y);
		double norm = Math.sqrt((org2.vel.x*org2.vel.x) + (org2.vel.y*org2.vel.y));
		org2.easePos(new Vector(0,0, org2.vel.x/norm, org2.vel.y/norm));

		org2.lastAck = this.lastAck;
		return org2;
	}

	// TODO: implement this functionality with a better de/serialization mechanism
	public String getData() {
		return  owner+","						 // 0
				+pos.x+","						 // 1
				+pos.y+","						 // 2
				+size + ","						 // 3
				+vel.x+","						 // 4
				+vel.y+","					     // 5
				+(lock ? "1":"0")+","			 // 6
				+(applyPosEase ? "1":"0")+","	 // 7
				+(applySizeEase ?"1":"0")+","	 // 8
				+massDelta+","					 // 9
				+easeDist+","					 // 10
				+easeVec.x+","					 // 11
				+easeVec.y+","					 // 12
				+mpDirect.x+","					 // 13
				+mpDirect.y+"," 				 // 14
				+mpCM.x+","						 // 15
				+mpCM.y+","						 // 16
				+lastAck;						 // 17
	}
	
}
