import org.java_websocket.WebSocket;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CopyOnWriteArrayList;

public class Player {
	List<Organ> myorgans;
	WebSocket conn;
	String name;
	int pid;	// player id
	
	public Player(WebSocket ws){
		conn = ws;
		Random rand = new Random();
		pid = ws.hashCode();		// the player id will just be the hash of the websocket
		
		myorgans = new ArrayList<Organ>();
		Organ temp = new Organ(pid, rand.nextDouble()*200, rand.nextDouble()*200,
				130, 6, 3);
		myorgans.add(temp);
		
		synchronized (GameDs.oLck) {
			GameDs.organsLists.add(myorgans);
		}
	}
	
	public String getData(){	// will be used for first message only
		return ""+conn.hashCode()+","+myorgans.get(0).pos.x+","+myorgans.get(0).pos.y+","+
				myorgans.get(0).size+","+myorgans.get(0).vel.x+","+myorgans.get(0).vel.y;
	}
	
	public void send(String data){
		conn.send(data);
	}

	/*
	public boolean isDead(){
		float max = -1;
		for (Organ organ : myorgans) 
			max = Math.max(max, organ.size);
		if(max < 5)
			return true;
		return false;
	}
	
	public  void kill(){
		System.out.println("Player "+ conn.hashCode() +" has died!!");
		conn.close(1000);
		conn = null;
		//players.remove(this);
	}
	 */
	@Override
	public boolean equals(Object obj) {
		return pid == ((Player)obj).pid;
	}
	
}
