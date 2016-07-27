function InfoPan(X,Y,Wid,Hei){
	this.panel = document.createElement('div');
	this.panel.id = "info";

	document.getElementsByTagName('body')[0].appendChild(this.panel);

	this.$info = $('info'); // We do this for performance, each time you do $() is searched the domain
	this.$centered = $('centered'); // We're using this div a lot so we should cache it to memory

	// using raw javascript to access properties
	this.set(X,Y,Wid,Hei);	// set variable properties

	// set propreties that won't change
	this.$info.css({
		'background': 'rgb(35, 35, 35)',
		'opacity': '0.65',
		'border': '1px solid black',
		'position': 'fixed',
		'display': 'none'
	});


	this.$info.mouseenter(function() {
		$(this).fadeTo('fast', 0.75);		// 'this' here refers to the object return by $(), it's different from the 'this' outside
		this.$centered.css('text-shadow', '0 0 3px #D92731');
	});

  this.$info.mouseleave( function() {
      $(this).fadeTo('fast', 0.65);
      this.$centered.css('text-shadow', 'none');
  });
  this.$info.append('<h1 class="centered"> Debug Menu </h1> <br />');
  this.$centered.css({
  					'text-align': 'center',
  					'font': 'bold solid',
  					'color': '#b0b0ff'//'#F92672'
  });
  this.$info.append('<div id = "data"><p/><p/><p/></div>');
}

InfoPan.prototype.set = function(X,Y,Wid,Hei){
	// get canvas size
	this.canvasW = $('canvas').width();
	this.canvasH = $("canvas").height();

	// set the position and size of the panel
	this.w = Wid || Math.floor(this.canvasW*0.13);
	this.h = Hei || Math.floor(this.canvasH*0.4);
	this.x = X || this.canvasW - this.w - 5;
	this.y = Y || 3;
  this.$info.css({
		// forced string conversion
		'width': Math.floor(this.h) + "px",
		'height': Math.floor(this.y) + "px",
		'top': Math.floor(this.y) + "px",
		'left': Math.floor(this.x) + "px"
	});
}

InfoPan.prototype.setLoc = function(X,W){
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
	$('#data p:nth-child(1)').html('cmx: '+ Math.floor(data.cmx*100)/100.0);
	$('#data p:nth-child(2)').html('cmy: '+ Math.floor(data.cmy*100)/100.0);
	$('#data p:nth-child(3)').html('Orgs#: '+ data.num);
}
