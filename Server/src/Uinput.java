public class Uinput {
	public int type;			// 0 for a mouse move, 1 for a mouse click
	public double xdir, ydir;
	public int pid;
	public Uinput(int Type, int pId, double xDir, double yDir)	{
		pid  = pId;
		xdir = xDir;
		ydir = yDir;
		type = Type;
	}
	
	@Override
	public boolean equals(Object obj) {
		return ((Uinput)obj).pid == pid && ((Uinput)obj).type == type;
	}
	
}
