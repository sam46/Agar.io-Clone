import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import org.java_websocket.WebSocket;

/******************************************************
	This thread will handle sending data to clients 
*******************************************************/

public class Broadcaster implements Runnable {
	@Override
	public void run() {
		while(true) {
			String data = "";
			//Queue<String> tempQueue = new LinkedList<String>();
			//List<WebSocket> tempList = new LinkedList<>();
		
			synchronized (GameDs.mLck) {
				//for (int i = 0; i < GameDs.msgBuf.size(); i++)
				while(!GameDs.msgBuf.isEmpty())
					data +=  GameDs.msgBuf.remove(0) + ";";		// separate each player/organ's data by ';'
					//tempQueue.add(GameDs.msgBuf.remove(0));
			}
			
			//for (int i = 0; i < tempQueue.size(); i++) 
				//data +=  tempQueue.remove() + ";";
			
			if(!data.isEmpty()) {
				data = data.substring(0, data.length() - 1);

				synchronized (GameDs.cLck) {
					for (WebSocket conn : GameDs.connections)
						//tempList.add(conn);
						conn.send(data);
				}
			}
			//for (WebSocket conn : tempList) 
				//conn.send(data);
			
			try {
				Thread.sleep(1000/GameDs.fRate);		// TODO: tweak/fix
			} catch (InterruptedException e) {}
			
		}	// end while
	}	// end run()
		
}