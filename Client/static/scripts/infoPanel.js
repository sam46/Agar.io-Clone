function InfoPan(X,Y,Wid,Hei){
	var self = this;
	this.$info = $('<div id = "info" />').appendTo('body');		// <div /> will create a new div element
 	this.set(X,Y,Wid,Hei);
 	
 	this.$info.append('<h1 class="centered"> Debug Menu </h1>');
  	this.$dataDiv = $('<div id = "data"/>').appendTo(this.$info)
  	this.$dataDiv.html('<p/><p/><p/><p/>');
  	this.data = this.$dataDiv.children().toArray();
	this.$info.css({
		'background': 'rgb(35, 35, 35)',
		'opacity': '0.65',
		'border': '1px solid black',
		'position': 'fixed',
		'display': 'none'
	});
	this.$info.mouseenter(function() {
		$(this).fadeTo('fast', 0.75);		// 'this' here refers to $info
		self.$centered.css('text-shadow', '0 0 3px #D92731');		// to access outer scope's data mebmer $centered we need a reference
	});
  	this.$info.mouseleave( function() {
    	$(this).fadeTo('fast', 0.65);
     	self.$centered.css('text-shadow', 'none');
 	});
 	
 	this.$centered = $('.centered'); // We're using this div a lot so we should cache it to memory
 	this.$centered.css({
  		'text-align': 'center',
  		'font': 'bold solid',
  		'color': '#b0b0ff'//'#F92672'
  	});
}

InfoPan.prototype.set = function(X,Y,Wid,Hei){
	// get canvas size
	this.canvasW = $('canvas').width();
	this.canvasH = $('canvas').height();

	// set the position and size of the panel
	this.w = Wid || Math.floor(this.canvasW*0.17);
	this.h = Hei || Math.floor(this.canvasH*0.4);
	this.x = X || this.canvasW - this.w - 5;
	this.y = Y || 3;
  	this.$info.css({
		// forced string conversion
		'width': Math.floor(this.w) + "px",
		'height': Math.floor(this.h) + "px",
		'top': Math.floor(this.y) + "px",
		'left': Math.floor(this.x) + "px"
	});
}

InfoPan.prototype.setLoc = function(X,Y){
	this.x = X;
	this.y = Y;
	this.$info.css({
		'top': Math.floor(this.y)+"px",
		'left': Math.floor(this.x)+"px"
	});
}

InfoPan.prototype.refresh = function() {
  	this.set();		// since no args are passed, the canvas size will be used
}

InfoPan.prototype.show = function(){
	this.$info.show();
}

InfoPan.prototype.hide = function(){
	this.$info.hide();
}

InfoPan.prototype.updateData = function(data) {
	// draw data on the panel
	$('#data p:nth-child(1)').html('Frame '+ data.frm);
	$('#data p:nth-child(2)').html('Server: ('+ Math.floor(data.cmx1*10)/10 + ", "+
		Math.floor(data.cmy1*10)/10 +")");
	$('#data p:nth-child(3)').html('Client: ('+ Math.floor(data.cmx2*10)/10 + ", "+
		Math.floor(data.cmy2*10)/10 +")");
}
