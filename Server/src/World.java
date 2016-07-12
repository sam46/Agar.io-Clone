import java.awt.peer.SystemTrayPeer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
/***********************************************************************
	This thread will handle input processing, physics and frame updates 
************************************************************************/

public class World implements Runnable  {
	private List<List<Organ>> organsListsCopy = new ArrayList<>();
	private BlockingQueue<Uinput> inputs;	// This class acts as consumer, it takes off the queue
	private long lastTime;
	public World(BlockingQueue<Uinput> queue) {
		this.inputs = queue;
		initFPS();
	}
	
	private void copyOrgansList(){
		organsListsCopy.clear();
		synchronized (GameDs.oLck) {
			organsListsCopy.addAll(0, GameDs.organsLists);
		}
	}	

	/*
	// Collision between two organs
	private void orgorgCollision(int time){
		for (int i = 0; i < organsCopy.size()-1; i++) {		
			GameObj p1 = organsCopy.get(i);
			for (int j = i+2; j < organsCopy.size(); j++) {
			    GameObj p2 = organsCopy.get(j);
				if(GameObj.intersect(p1, p2)) {	 
					//   TODO: Handle collisions
				}
			}	
		}
	
	}
	*/
	
	// Collision between a blob and an organ
	private void orgblobCollision(){
		
	}
	
	// Send new data to msg buffer to be handled by the broadcasting thread
	private void dispatchToMsgBuf(){
		synchronized (GameDs.mLck) {
			int cur = -1;
			for (List<Organ> orgList : organsListsCopy) {
				for (Organ org : orgList)
					GameDs.msgBuf.add(
						//((org.owner!=cur) ? org.owner : "") + ","+org.getData()
							org.owner + ","+ org.getData()
					);
			}
		}
	}

	private void calCM(List<Organ> curPlayer){
		// for every List (which represents a player)

		double avgX = 0.0, avgY = 0.0;
		double count = curPlayer.size();

			for(int i=0; i < count; i++) {
				avgX += curPlayer.get(i).pos.x;
				avgY += curPlayer.get(i).pos.y;
			}
			for(int i=0; i < count; i++) {
				curPlayer.get(i).mpCMx = avgX / count;
				curPlayer.get(i).mpCMy = avgY / count;
			}

	}

	private void constrain(List<Organ> curPlayer){

			double directX = curPlayer.get(0).mpDirectX,
			       directY = curPlayer.get(0).mpDirectY;

			// after the organs are packed, they can't keep going in their direction, they have to start going in the CM direction
			for (int i = 0; i < curPlayer.size(); i++) {
				Organ org = curPlayer.get(i);
				if (org.lock && (org.applyPosEase == false) && (org.applyPosEase == false)) {
					double mag = Math.sqrt(org.vel.x * org.vel.x + org.vel.y * org.vel.y);
					double ang = Math.atan2(directY, directX);
					org.vel = new Vector(0,0, Math.cos(ang) * mag,
							 Math.sin(ang) * mag);
				}
			}

			// check for collision between mp's organs
			for (int i = 0; i < curPlayer.size() - 1; i++) {
				Organ org1 = curPlayer.get(i);
				for (int j = i + 1; j < curPlayer.size(); j++) {
					Organ org2 = curPlayer.get(i);

					double radSum = org2.size + org1.size;        // sum of radii
					double distSqr = distSq(org1.pos.x, org1.pos.y, org2.pos.x, org2.pos.y);    // distance between centers squared

					if (Math.pow(radSum, 2) + 0.5 > distSqr) {        // if there's an intersection

						double interleave = radSum - Math.sqrt(distSqr);    // how much are the two circles intersecting?  r1 + r2 - distnace

						// create a vector o12 going from org1 to org2
						// push the two organs apart, push org2 in the direction of the o12, and org1 in the opposite direction of o12
						double o12x = org2.pos.x - org1.pos.x, o12y = org2.pos.y - org1.pos.y;
						double o12ang = Math.atan2(o12y, o12x);
						// the exact distance each one will be pushed(from its original location) is interleave/2
						org2.pos.add( Math.cos(o12ang) * (interleave / 2),
								Math.sin(o12ang) * (interleave / 2) );
						org1.pos.add( Math.cos(o12ang) * (-interleave / 2),
								Math.sin(o12ang) * (-interleave / 2) );

						org1.lock = true;
						org2.lock = true;
					}

				}

			}

	}
	
	// Input processing: remember this method shares the thread-safe input buffer!!
	private void procInput() {

		/*if(inputs.isEmpty()) return;
		
		// This variable determines how many inputs to process each frame
		int batchSize = 200;				// TODO: twveak
		
		List<Organ> tempList = new ArrayList<>();	// temporary list to hold any new organs that need to be created
		while(batchSize > 0 && !inputs.isEmpty()){
			Uinput uin = inputs.remove();
			for (Organ temp : organsCopy) {
				if(temp.owner == uin.pid) {
					
					float ang = (float) Math.atan2(uin.ydir, uin.xdir);
					
					if(uin.type==0) {		// a mouse move:
						temp.speed = new Vector(ang, temp.speed.mag);
					}
					else {					// a mouse click: Splitting and Launching
						
						// Only temporary solution!!
						
						/* create a new Organ and launch it using ease() */
		/*
						float massExchange = temp.size/2.0f;	// the original organ will launch half its mass 
						
						Organ shell = new Organ(temp.owner);	// the new launching organ
						shell.size = massExchange;
						shell.pos = new Vector(temp.pos);
						shell.speed = new Vector(temp.speed);
						
						shell.easePos(ang);						// smoothly animate the launch of the projectiled organ
						temp.easeSize(-massExchange);			// smoothly decrease the size of the original organ
						
						tempList.add(shell);
						
					}
								
				}
				
			}
			batchSize--;
		}
		
		// add newly created organs to the main organs list
		if(tempList.isEmpty()) return;
		organsCopy.addAll(tempList);
		synchronized (GameDs.oLck) {
			GameDs.organs.addAll(tempList);
		}
		*/


		if(inputs.isEmpty()) return;
		int batchSize = 30;
		while(batchSize > 0 && !inputs.isEmpty()) {

			Uinput input = inputs.remove();
			List<Organ> curPlayer = null;

			// find to whom does this input belongs, store it in curPlayer
			for (List<Organ> player : organsListsCopy) {
				if(player.get(0).owner == input.pid)
					curPlayer = player;
				break;
			}


			// FIX: curPlayer is null sometimes !!

			// assert curPlayer ain't null
			if(curPlayer == null )
				System.out.println("---Fatal Error: curPlayer is null/Empty");
			if(curPlayer.isEmpty())
				System.out.println("---Fatal Error: curPlayer is Empty");


			// handle input for curPlayer
			List<Organ> tempOrgans = new ArrayList<>();
			for (int i = 0; i < curPlayer.size(); i++) {
				// each organ will try to move towards the mouse pointer, but later when the organs are packed together, they'll follow CM direction

				double xspd = curPlayer.get(i).vel.x;
				double yspd = curPlayer.get(i).vel.y;
				double mag =  Math.sqrt(xspd * xspd + yspd * yspd);
				double ang = Math.atan2(input.ydir  - curPlayer.get(i).pos.y + curPlayer.get(i).mpCMy,            // the direction angle from the organ to the mouse location
						input.xdir  - curPlayer.get(i).pos.x + curPlayer.get(i).mpCMx);


				curPlayer.get(i).vel = new Vector(0, 0, Math.cos(ang) * mag,
							Math.sin(ang) * mag);
				curPlayer.get(i).mpDirectX = input.xdir;
				curPlayer.get(i).mpDirectY = input.ydir;

				if (input.type == 1)
					tempOrgans.add(curPlayer.get(i).split());
			}

			for (int i = 0; i < tempOrgans.size(); i++)
				curPlayer.add(tempOrgans.get(i));

		}

	}


	@Override
	public void run() {
		
	/* Delta-timing variables */
		lastTime = System.nanoTime();
		final int times = 60;				// the physics (coords updates) should update 60 times a second
		double ns = 1000000000.0 / times;  	// the time till the next physics update in nano seconds  
		double delta = 0;				
		
		while(true) {
			copyOrgansList();		// oLck blocking
			procInput();			// input buffer blocking

		    /* Delta-timing: guarantees consistent movements and updates regardless of the time each frame takes */
		    long now = System.nanoTime();
			displayFPS(now);
			delta += (now - lastTime) / ns;  // detla += actual elapsed time / time required for 1 update
		    lastTime = now;
		    if(delta >= 1) { // if enough time has passed: update

				if(!organsListsCopy.isEmpty()) {
				//	System.out.println("pos: "+organsListsCopy.get(0).get(0).pos.x + ",  " + organsListsCopy.get(0).get(0).pos.y);
					System.out.println("vel: "+organsListsCopy.get(0).get(0).vel.x + ",  " + organsListsCopy.get(0).get(0).vel.y);
				}
		    	for (List<Organ> li : organsListsCopy) {
					for (Organ temp : li)
						temp.update(1.0 / times);
					constrain(li);
					calCM(li);
				}
		    	

				delta--;					
		    }

		    /* -------------------------------------------------------------------------------------------------- */
			
		   // orgorgCollision(times);
		   // orgblobCollision();
			dispatchToMsgBuf();		// mLck blocking


			/*
				TODO:
				fix time stepping/FPS
				currently server and cleint are out of sync

			 */

			try { Thread.sleep(1000/times); }
			catch (InterruptedException e) { e.printStackTrace(); }
			
		}	// end while		
		
	} // end run()


	double distSq(double x1, double y1, double x2, double y2) {
		return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
	}

	double fps[];
	int _ind_ = 0;
	void initFPS() {
		this.fps = new double[10];
		for(int i=0; i < 10; i++) fps[0] = 0.0;
	}
	double calAVG() {
		double count = 0.0;
		for (int i=fps.length-1; i>0; i--)
			count+=fps[i];

		return Math.round(count/fps.length);
	}
	void displayFPS(long now){

		fps[_ind_%10] = 1000000000.0/(now-lastTime);
		_ind_++;
		System.out.println("FPS: "+calAVG());
	}

}
	