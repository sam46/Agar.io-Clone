import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.StringTokenizer;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import org.java_websocket.WebSocket;
import org.java_websocket.WebSocketImpl;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_17;
import org.java_websocket.framing.FrameBuilder;
import org.java_websocket.framing.Framedata;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
public class MyWsServer extends WebSocketServer {
	private static int counter = 0;	// count how many players are currently connected
	private volatile StringTokenizer stok;

// We'll receive input from onMessage and store it in this thread-safe buffer:
	private BlockingQueue<Uinput> inputBuf = new LinkedBlockingQueue<>(); 
// The consumer of the buffer will be the World thread 
// Note: since this buffer is thread-safe, we wont have to use locks for synchronization

	
	public MyWsServer( int port , Draft d ) throws UnknownHostException {
		super( new InetSocketAddress( port ), Collections.singletonList( d ) );
	}
	
	public MyWsServer( InetSocketAddress address, Draft d ) {
		super( address, Collections.singletonList( d ) );
	}

	@Override
	public void onOpen( WebSocket conn, ClientHandshake handshake ) {
		
		Player p = new Player(conn);
		p.send(p.getData()); // send first message which should contain initial data (i.e pid)
		
		synchronized (GameDs.cLck) {
			GameDs.connections.add(conn);
		}
	
		synchronized (GameDs.pLck) {
			GameDs.players.add(p);
		}

		counter++;
		System.out.println( "///////////Opened connection number" + counter );
	}

	@Override
	public  void onClose( WebSocket conn, int code, String reason, boolean remote ) {
		System.out.println( "closed" );
		int pid = conn.hashCode();
		
		synchronized (GameDs.cLck) {
			GameDs.connections.remove(conn);
		}
		
		synchronized (GameDs.pLck) {
			int ind = -1;
			for(Player pl : GameDs.players){
				ind++;
				if(pl.pid == pid)
					break;
			}
			GameDs.players.remove(ind);
		}
	}

	@Override
	public void onError( WebSocket conn, Exception ex ) {
		System.out.println( "Error:" );
		ex.printStackTrace();
	}

	@Override
	public  void onMessage( WebSocket conn, String message ) {
		//System.out.println("in: "+message);

		// route this message to GameDs.inputBuf
		int type;
		Uinput uin = null;
		stok = new StringTokenizer(message, ",");
		String fstTok = stok.nextToken();

		// message type is 0 -->  mouse move
		if(fstTok.equals("mm"))	type = 0;

		// message type is 1 --> mouse down
		else if (fstTok.equals("md")) 
			type = 1;
		else return;
		
		try {
			uin = new Uinput( type, conn.hashCode(), Double.parseDouble(stok.nextToken()),
				 Double.parseDouble(stok.nextToken()),
					Integer.parseInt(stok.nextToken()) );
		} catch(Exception e){ 
			e.printStackTrace();
			System.exit(0);
		}
		
		try{
			inputBuf.add(uin);		// Thread-Critical statement!!
		} catch(Exception e){ 
			e.printStackTrace();
			//System.out.println(message);
			System.exit(0);
		}

	}


	@Override
	public void onMessage(WebSocket conn, ByteBuffer message){
		// binary ByteArray message received
	}

	public void onWebsocketMessageFragment( WebSocket conn, Framedata frame ) {
		FrameBuilder builder = (FrameBuilder) frame;
		builder.setTransferemasked( false );
		conn.sendFrame( frame );
	}
	

	public static void main(String[] args) throws UnknownHostException { // Thread 1:  main thread
		WebSocketImpl.DEBUG = false;
		int port;
		try {
			port = new Integer( args[ 0 ] );
		} catch ( Exception e ) {
			System.out.println( "No port specified. Defaulting to 8080" );
			port = 8080;
		}

		MyWsServer server = new MyWsServer( port, new Draft_17() );		 // Thread 2
		Thread bc = new Thread(new Broadcaster());					     // Thread 3
		Thread wrld = new Thread(new World(server.inputBuf));			 // Thread 4

		server.start();
		bc.start();
		wrld.start();
	}
	
}


