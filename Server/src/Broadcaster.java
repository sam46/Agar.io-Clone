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
		
			synchronized (GameDs.mLck) {
				//for (int i = 0; i < GameDs.msgBuf.size(); i++)
				while(!GameDs.msgBuf.isEmpty())
					data +=  GameDs.msgBuf.remove(0) + ";";		// separate each player/organ's data by ';'
			}
			
			if(!data.isEmpty()) {
				data = data.substring(0, data.length() - 1);
				synchronized (GameDs.cLck) {
					for (WebSocket conn : GameDs.connections)
						conn.send(data);
				}
			}

			try {
				Thread.sleep(9);		// TODO: tweak/fix
			} catch (InterruptedException e) {}
			
		}	// end while
	}	// end run()
		
}