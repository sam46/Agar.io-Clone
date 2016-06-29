
/******************************************************
	The player can have many organs
*******************************************************/

public class Organ extends GameObj {
	int owner;
	
	/* Easing variables */
	private static final float ease_step = 0.5f, ease_spd = 60;		// control the speed of the easing and how many frames it takes to finish
	private float easeDist,			// how far will the organ go when launched
				  massDelta;		// how much will the increase/decrease in size be. could be + or -
	private Vector easeVec;			// in which direction will the organ launch
	private boolean applyPosEase = false, applySizeEase = false;
	
	public Organ(int pid) {
		this.owner = pid;
	}
	
	@Override
	public void absorb(GameObj small){
		
	}

	@Override
	public void consume(GameObj big) {

	}
	
	public void easePos(float ang){			// give this organ launch speed which will smoothly affect its pos over many frames
		easeVec = new Vector(ang, 1.0f);	// unit direction vector
		easeDist = size*15;				// TODO: tweak this
		applyPosEase = true;
	}

	public void easeSize(float massDelta){		// smoothly change this organ's size by massDelta over many frames
		this.massDelta = massDelta; 	
		applySizeEase = true;
	}
	
	
	
	public void update(float dt){
		move(dt);
		
		if(applyPosEase){	
			pos.add(ease_spd*dt*easeVec.x*ease_step*easeDist, ease_spd*dt*easeVec.y*ease_step*easeDist);
			easeDist -= ease_spd*dt*ease_step*easeDist;
			if(Math.abs(easeDist) <= 0.001f)
				applyPosEase = false;
		}
		
		if(applySizeEase){
			size += ease_spd*dt*massDelta*ease_step;
			massDelta -= ease_spd*dt*massDelta*ease_step;
			if(Math.abs(massDelta) <= 0.001f)
				applySizeEase = false;
		}
	}
	
	public void move(float dt) {
		pos.add(dt*speed.x, dt*speed.y);
				
		// teleport to the other side if beyond world space
		if(pos.x>3000) pos.x = -3000;
		else if (pos.x<-3000) pos.x = 3000;
		if(pos.y>3000) pos.y = -3000;
		else if (pos.y<-3000) pos.y = 3000;
		
		
		/*System.out.println(owner);
		System.out.println("\tspeed: "+speed.x+"  "+speed.y);
		System.out.println("\tpos:   "+pos.x+"  "+pos.y);
		System.out.println("----------------------");*/
	}
	
	public  String getData(){
		return pos.x+","+pos.y+","+size+","+speed.x+","+speed.y;
	}
	
}
