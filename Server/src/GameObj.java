// A game object is the base type of: Organs and Blobs
public class GameObj {
	double size = 0;
	double sizeFinal = 0;

	Vector pos = null, vel = null;
	
//	public void absorb(GameObj small){}
//	public void consume(GameObj big){}
//
//	public  String getData(){
//		return pos.x+","+pos.y+","+size;
//	}
//
//	public static boolean intersect(GameObj p1, GameObj p2) {
//		double r1 = p1.size, r2 = p2.size;
//		double x1 = p1.pos.x, x2 = p2.pos.x;
//		double y1 = p1.pos.y, y2 = p2.pos.y;
//		double dist2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
//		if(dist2 < Math.max(r1*r1,r2*r2)){
//			System.out.println("INTERSECTION");
//			return true;
//		}
//		return false;
//	}
	
}
