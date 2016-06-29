public class Vector {
	
	public double th ;
	public float x,y;
	public float mag;
	public Vector normalized;
	
	private void calMag() {
		mag = ( float) Math.sqrt( (x)*(x) + (y)*(y) );
	}
	
	private void calTh() {
		th = Math.atan2(y, x);
	}
	
	private void calCartesian() {
		x = (float) (mag*Math.cos(th));
		y = (float) (mag*Math.sin(th));
	}
	
	public Vector(double dir ,float mag) {
		th = dir;
		this.mag = mag;
		calCartesian();
	}
	
	public Vector(Vector vec){	// copy ctor
		this(vec.th, vec.mag);
	}

	public Vector(float xi,float yi,float xf,float yf){
		x = xf-xi; y = yf-yi;
		calMag();
		calTh();
	}
	
	public void invert(){
		Scale(-1);
		calMag();
		calTh();
		Normalize();
	}

	private void Normalize(){
		calMag();
		normalized = new Vector(x/mag, y/mag);
	}

	public void Scale(float c){
		x = x*c;
		y = y*c;
		calMag();
		calTh();
	}
	
	public Vector getNormalized(){
		Normalize();
		return normalized;
	}
	
	public void add(float X, float Y){
		this.x += X;
		this.y += Y;
		
		calMag();
		calTh();
	}
	
}
