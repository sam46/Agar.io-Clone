import java.util.ArrayList;
import java.util.List;
import org.java_websocket.WebSocket;

/******************************************************
 	This class will contain global variables and locks
*******************************************************/

public class GameDs {

	/*-------------   Shared Objects --------------------*/
	public static List<List<Organ>> organsLists = new ArrayList<>();
	public static List<Blob> blobs = new ArrayList<>();
	public static List<Player> players = new ArrayList<>();
	public static List<WebSocket> connections = new ArrayList<>();
	public static List<String> msgBuf = new ArrayList<>();   

	/*--------------	Locks  ------------------------------*/
	public final static Object pLck = new Object();	// players list lock;
	public final static Object oLck = new Object();	// organs list lock;;
	public final static Object bLck = new Object();	// blobs list lock;
	public final static Object mLck = new Object();	// message buffer lock
	public final static Object cLck = new Object();	// connections(WebSockets) list lock

	public final static double timestep = 17;
}
