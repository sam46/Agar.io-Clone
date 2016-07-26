function InfoPan(X,Y,Wid,Hei){
	this.panel = document.createElement('div');
	this.panel.id = "info";

	document.getElementsByTagName('body')[0].appendChild(this.panel);

	// using raw javascript to access properties
	this.set(X,Y,Wid,Hei);	// set variable properties

	// set propreties that won't change
	this.panel.style.background = "rgb(35, 35, 35)";
	this.panel.style.opacity = "0.65";
	this.panel.style.border = "1px solid black";
	this.panel.style.position = "fixed";
	this.panel.style.display = "none";

	// Styling with jquery
	$('#info').mouseenter(function() {
		$(this).fadeTo('fast', 0.75);		// 'this' here refers to the object return by $(), it's different from the 'this' outside
		$('.centered').css('text-shadow', '0 0 3px #D92731');

	});
    $('#info').mouseleave( function() {
        $(this).fadeTo('fast', 0.65);	
        $('.centered').css('text-shadow', 'none');
    });
    $('#info').append('<h1 class="centered"> Debug Menu </h1> <br />');
    $('.centered').css({
    					'text-align': 'center',
    					'font': 'bold solid',
    					'color': '#b0b0ff'//'#F92672'
    					});
    $('#info').append('<div id = "data"><p/><p/><p/></div>');
}

InfoPan.prototype.set = function(X,Y,Wid,Hei){ 
	// get canvas size
	var canvasW = document.getElementById("canvas").width,
		canvasH = document.getElementById("canvas").height;

	// set the position and size of the panel
	this.w = Wid || Math.floor(canvasW*0.13);
	this.h = Hei || Math.floor(canvasH*0.4);
	this.x = X || canvasW - this.w - 5;
	this.y = Y || 3;
    this.panel.style.width = Math.floor(this.w) + "px";
    this.panel.style.height = Math.floor(this.h) + "px";
    this.panel.style.top = Math.floor(this.y) + "px";
    this.panel.style.left = Math.floor(this.x) + "px";

}

InfoPan.prototype.setLoc = function(X,W){
	this.x = X;
	this.y = Y;
	this.panel.style.top = Math.floor(this.y)+"px";
	this.panel.style.left = Math.floor(this.x)+"px";
}

InfoPan.prototype.refresh = function() {
   this.set();		// since no args are passed, the canvas size will be used
}

InfoPan.prototype.show = function(){
	this.panel.style.display = "block";
}

InfoPan.prototype.hide = function(){
	this.panel.style.display = "none";
}

InfoPan.prototype.updateData = function(data) {
	// draw data on the panel
	$('#data p:nth-child(1)').html('cmx: '+data.cmx);
	$('#data p:nth-child(2)').html('cmy: '+data.cmy);
	$('#data p:nth-child(3)').html('Orgs#: '+data.num);
}
