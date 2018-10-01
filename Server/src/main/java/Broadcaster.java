import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import org.java_websocket.WebSocket;

/******************************************************
	This thread will handle sending data to clients 
*******************************************************/

public class Broadcaster implements Runnable {
	static int counter = 0;
	static int bandwidth = 0;
	@Override
	public void run() {
		while(true) {
			counter++;
			String data = "";
		
			synchronized (GameDs.mLck) {
				while(!GameDs.msgBuf.isEmpty())
					data +=  GameDs.msgBuf.remove(0) + ";";		// separate each player/organ's data by ';'
			}
			if(!data.isEmpty()) {
				data = data.substring(0, data.length() - 1);

				bandwidth += data.length()*2;
				if(counter >= 10) {
					System.out.println( Math.round(bandwidth*10/1024.0)/10.0+ "  KBps per player");
					counter = 0;
					bandwidth = 0;
				}

				synchronized (GameDs.cLck) {
					for (WebSocket conn : GameDs.connections)
						conn.send(data);
				}
			}

			try {
				Thread.sleep(100);		// TODO: tweak/fix
			} catch (InterruptedException e) {}
			
		}	// end while
	}	// end run()
		
}