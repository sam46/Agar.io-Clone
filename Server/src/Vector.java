public class Vector {
	public double th, mag;
	public double x, y;
	private Vector normalized;
	
	private void calMag() {
		mag = Math.sqrt(x*x + y*y);
	}
	
	private void calTh() {
		th = Math.atan2(y, x);
	}
	
	private void calCartesian() {
		x =  mag*Math.cos(th);
		y =  mag*Math.sin(th);
	}

	private void calNormalized() {
		normalized = new Vector(x/mag, y/mag);
	}

	public Vector(double dir ,double mag) {
		this.th = dir;
		this.mag = mag;
		calCartesian();
	}
	
	public Vector(Vector vec) {
		this(vec.th, vec.mag);
	}

	public Vector(double xi,double yi,double xf,double yf) {
		x = xf-xi; y = yf-yi;
		calMag();
		calTh();
	}

	public void Scale(double c) {
		x *= c;
		y *= c;
		mag *= c;
	}
	
	public Vector getNormalized() {
		calNormalized();
		return normalized;
	}

	public void Normalize() {
		Scale(1.0/mag);
	}

	public void add(Vector other) {
		add(other.x, other.y);
	}
	
	public void add(double X, double Y) {
		this.x += X;
		this.y += Y;
		calMag();
		calTh();
	}

	public void print(){
		System.out.println("( "+this.x+",  "+this.y+" )");
	}
	
}
