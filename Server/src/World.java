import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

/***********************************************************************
	This thread will handle input processing, physics and frame updates 
************************************************************************/

public class World implements Runnable {
	private List<Organ> organsCopy = new ArrayList<>();	
	private BlockingQueue<Uinput> inputs;	// This class acts as consumer, it takes off the queue

	public World(BlockingQueue<Uinput> queue) {
		this.inputs = queue;
	}
	
	private void copyOrgansList(){
		organsCopy.clear();
		synchronized (GameDs.pLck) {
			organsCopy.addAll(0, GameDs.organs);
		}
	}	
	
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
	
	// Collision between a blob and an organ
	private void orgblobCollision(){
		
	}
	
	// Send new data to msg buffer to be handled by the broadcasting thread
	private void dispatchToMsgBuf(){
		synchronized (GameDs.mLck) {
			int cur = -1;
			for (Organ org : organsCopy) {
				GameDs.msgBuf.add(
					((org.owner!=cur) ? org.owner : "") + ","+org.getData()
				);
			}
		}
	}
	
	// Input processing: remember this method shares the thread-safe input buffer!!
	private void procInput(){
		if(inputs.isEmpty()) return;
		
		// This variable determines how many inputs to process each frame
		int batchSize = 200;				// TODO: tweak
		
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
		
	}
	
	
	@Override
	public void run() {
		
	/* Delta-timing variables */
		long lastTime = System.nanoTime();
		final int times = 60;				// the physics (coords updates) should update 60 times a second
		double ns = 1000000000.0 / times;  	// the time till the next physics update in nano seconds  
		double delta = 0;				
		
		while(true) {
			copyOrgansList();		// pLck blocking
			procInput();			// input buffer blocking, pLck blocking
			
		/* Delta-timing: guarantees consistent movements and updates regardless of the time each frame takes */
		    long now = System.nanoTime();
		    delta += (now - lastTime) / ns;  // detla += actual elapsed time / time required for 1 update
		    lastTime = now;
		    if(delta >= 1) { // if enough time has passed: update
				
		    	for (Organ temp : organsCopy) 
					temp.update(1.0f/times);
		    	
				
				delta--;					
		    }
		/* -------------------------------------------------------------------------------------------------- */   
			
		    orgorgCollision(times);
			orgblobCollision();
			dispatchToMsgBuf();		// mLck blocking
			
			
			try { Thread.sleep(times); }
			catch (InterruptedException e) { e.printStackTrace(); }
			
		}	// end while		
		
	} // end run()
	
	

}
	