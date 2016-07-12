
/******************************************************
	The player can have many organs
*******************************************************/

public class Organ extends GameObj {
	int owner;
	public boolean lock = false;
	public double mpDirectX, mpDirectY;
	public double mpCMx = -1, mpCMy = -1;
	/* Easing variables */
	private static final double ease_step = 0.5, ease_spd = 60;		// control the speed of the easing and how many frames it takes to finish
	private double easeDist,			// how far will the organ go when launched
				  massDelta;		// how much will the increase/decrease in size be. could be + or -
	private Vector easeVec;			// in which direction will the organ launch
	public boolean applyPosEase = false, applySizeEase = false;


	
	public Organ(int pid) {
		this.owner = pid;
	}

	public Organ(int pid, double x, double y, double size, double xspd, double yspd) {
		this.owner = pid;
		this.pos = new Vector(0,0, x, y);
		this.vel = new Vector(0,0, xspd, yspd);
		this.size = size;
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
	
	
	
	public void update(double dt){
		move(dt);
		
		if(applyPosEase){	
			pos.add(ease_spd*dt*easeVec.x*ease_step*easeDist, ease_spd*dt*easeVec.y*ease_step*easeDist);
			easeDist -= ease_spd*dt*ease_step*easeDist;
			if(Math.abs(easeDist) <= 0.001f) {
				applyPosEase = false;
				lock = true;
			}
		}
		
		if(applySizeEase){
			size += ease_spd*dt*massDelta*ease_step;
			massDelta -= ease_spd*dt*massDelta*ease_step;
			if(Math.abs(massDelta) <= 0.001f)
				applySizeEase = false;
		}
	}
	
	public void move(double dt) {
		pos.add(vel.x, vel.y);
				
		// teleport to the other side if beyond world space
		//if(pos.x>3000) pos.x = -3000;
		//else if (pos.x<-3000) pos.x = 3000;
		//if(pos.y>3000) pos.y = -3000;
		//else if (pos.y<-3000) pos.y = 3000;
		
		
		/*System.out.println(owner);
		System.out.println("\tspeed: "+speed.x+"  "+speed.y);
		System.out.println("\tpos:   "+pos.x+"  "+pos.y);
		System.out.println("----------------------");*/
	}

	public Organ split(){
		this.easeSize(-this.size/2.0);

		Organ org2 = new Organ(this.owner, this.pos.x, this.pos.y, this.size/2,
				this.vel.x, this.vel.y);
		double norm = Math.sqrt((org2.vel.x*org2.vel.x) + (org2.vel.y*org2.vel.y));
		org2.easePos(new Vector(0,0, org2.vel.x/norm, org2.vel.y/norm));

		return org2;
	}
	
	public  String getData(){
		return pos.x+","+pos.y+","+size;
	}
	
}
