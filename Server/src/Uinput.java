public class Uinput {
	public int type;			// 0 for a mouse move, 1 for a mouse click
	public double xdir, ydir;
	public int pid;
	public int seq;				// input sequence number
	public Uinput(int Type, int pId, double xDir, double yDir, int Seq)	{
		pid  = pId;
		xdir = xDir;
		ydir = yDir;
		type = Type;
		seq = Seq;
	}
	
	@Override
	public boolean equals(Object obj) {
		return ((Uinput)obj).pid == pid && ((Uinput)obj).type == type;
	}
	
}
