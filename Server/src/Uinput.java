public class Uinput {
	public int type;			// 0 for a mouse move, 1 for a mouse click
	public float xdir, ydir; 
	public int pid;
	public Uinput(int Type, int pId, float xDir, float yDir)	{
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
