var width, height, center;
var smooth = true;

var points = 6;
var path = new Path();

var pointsUp = 6;
var pathUp = new Path();

var pointsUpRight = 2;
var pathUpRight = new Path();

var pointsUpRight2 = 2;
var pathUpRight2 = new Path();

var pointsDownRight = 4;
var pathDownRight = new Path();

var mousePos = view.center / 2;
var pathHeight = mousePos.y;

var mouseInteract = 1;

//------ background color --------


var myCircle = new Path.Circle(new Point(150, 750), 300);
myCircle.sendToBack();
myCircle.fillColor = {
        gradient: {
            stops: ['rgba(246, 79, 89,0)','rgba(255, 0, 204,0.6)']
        },
        origin: (0,200),
       	destination: (view.size.width/2, 800)
 };

var myCircleRight = new Path.Circle(new Point(1350, 800), 400);
myCircleRight.sendToBack();
myCircleRight.fillColor = {
        gradient: {
            stops: ['rgba(255, 192, 203,0.4)','rgba(128, 0, 128,0.6)']
        },
        origin: (600,500),
       	destination: (view.size.width, 1000)
 };

 var rect = new Path.Rectangle({
    point: [0, 0],
    size: [view.size.width, view.size.height],
    // strokeColor: 'white',
    // selected: true
});
rect.sendToBack();
rect.fillColor = {
        gradient: {
            stops: ['#2a0845', '#6441A5']
        },
        origin: (view.size.width/2,0),
       	destination: (view.size.width/2, view.size.height)
 };

// ----------- color ---------------
path.fillColor =  {
        gradient: {
            stops: ['#9258eb', '#313edc']
        },
        origin: (0,300),
       	destination: (0,800)
 };

 pathUp.fillColor =  {
        gradient: {
            stops: ['#FEAC5E', '#C779D0','#4BC0C8']
        },
        origin: (0,40),
       	destination: (400,400)
 };

  pathDownRight.fillColor =  {
        gradient: {
            stops: ['#ffce49', '#e93e75']
        },
        origin: (1000,600),
       	destination: (1800,1100)
 };

  pathUpRight.fillColor =  {
        gradient: {
            stops: ['rgba(43, 50, 178,0.3)','rgba(20, 136, 204,0.7)']
        },
        origin: (1000,-100),
       	destination: (1800,1000)
 };

  pathUpRight2.fillColor =  {
        gradient: {
            stops: ['rgba(106, 48, 147,0.3)','rgba(160, 68, 255,0.5)']
        },
        origin: (1000,-100),
       	destination: (1800,1000)
 };



// ball -------------
function Ball(r, p, v) {
	this.radius = r;
	this.point = p;
	this.vector = v;
	this.maxVec = 15;
	this.numSegment = Math.floor(r / 3 + 2);
	this.boundOffset = [];
	this.boundOffsetBuff = [];
	this.sidePoints = [];
	this.path = new Path({
		fillColor: {
			 gradient: {
            stops: ['yellow', 'red', 'blue']
       		 },
        	origin: (0,0),
        	destination: (1600,800)
		},
		blendMode: 'lighter'
	});

	for (var i = 0; i < this.numSegment; i ++) {
		this.boundOffset.push(this.radius);
		this.boundOffsetBuff.push(this.radius);
		this.path.add(new Point());
		this.sidePoints.push(new Point({
			angle: 360 / this.numSegment * i,
			length: 1
		}));
	}
}

Ball.prototype = {
	iterate: function() {
		this.checkBorders();
		if (this.vector.length > this.maxVec)
			this.vector.length = this.maxVec;
		this.point += this.vector;
		this.updateShape();
	},

	checkBorders: function() {
		var size = view.size;
		if (this.point.x < -this.radius)
			this.point.x = size.width + this.radius;
		if (this.point.x > size.width + this.radius)
			this.point.x = -this.radius;
		if (this.point.y < -this.radius)
			this.point.y = size.height + this.radius;
		if (this.point.y > size.height + this.radius)
			this.point.y = -this.radius;
	},

	updateShape: function() {
		var segments = this.path.segments;
		for (var i = 0; i < this.numSegment; i ++)
			segments[i].point = this.getSidePoint(i);

		this.path.smooth();
		for (var i = 0; i < this.numSegment; i ++) {
			if (this.boundOffset[i] < this.radius / 4)
				this.boundOffset[i] = this.radius / 4;
			var next = (i + 1) % this.numSegment;
			var prev = (i > 0) ? i - 1 : this.numSegment - 1;
			var offset = this.boundOffset[i];
			offset += (this.radius - offset) / 30; // original 15
			offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
			this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
		}
	},

	react: function(b) {
		var dist = this.point.getDistance(b.point);
		if (dist < this.radius + b.radius && dist != 0) {
			var overlap = this.radius + b.radius - dist;
			var direc = (this.point - b.point).normalize(overlap * 0.005); // original 0.015
			this.vector += direc;
			b.vector -= direc;

			this.calcBounds(b);
			b.calcBounds(this);
			this.updateBounds();
			b.updateBounds();
		}
	},

	getBoundOffset: function(b) {
		var diff = this.point - b;
		var angle = (diff.angle + 180) % 360;
		return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
	},

	calcBounds: function(b) {
		for (var i = 0; i < this.numSegment; i ++) {
			var tp = this.getSidePoint(i);
			var bLen = b.getBoundOffset(tp);
			var td = tp.getDistance(b.point);
			if (td < bLen) {
				this.boundOffsetBuff[i] -= (bLen  - td) / 2;
			}
		}
	},

	getSidePoint: function(index) {
		return this.point + this.sidePoints[index] * this.boundOffset[index];
	},

	updateBounds: function() {
		for (var i = 0; i < this.numSegment; i ++)
			this.boundOffset[i] = this.boundOffsetBuff[i];
	}
};

var balls = [];
var numBalls = 4;
for (var i = 0; i < numBalls; i++) {
	var position = Point.random() * view.size;
	var vector = new Point({
		angle: 360 * Math.random(),
		length: Math.random() * 10
	});
	var radius = Math.random() * 60 + 60;
	balls.push(new Ball(radius, position, vector));
}

// --------------------

initializePath();
initializePathUp();
initializePathDownRight();
initializePathUpRight2();
initializePathUpRight();
//-----------path -------------


function initializePath() {
	center = view.center;
	width = view.size.width;
	height = view.size.height / 2;
	path.segments = []; 
	path.add(-100, view.size.height); //start point left
	for (var i = 1; i < points; i++) {
		var point = new Point(800 / points * i, center.y+400);
		path.add(point);
	}
	path.add(800, view.size.height); //end point right
	// path.fullySelected = true;
}


function initializePathUp() {
	// center = view.center;
	// width = view.size.width;
	// height = view.size.height / 2;
	pathUp.segments = []; 
	pathUp.add(-100, 0); //start point left
	for (var i = 1; i < pointsUp; i++) {
		var pointUp = new Point(700 / points * i, center.y-400);
		pathUp.add(pointUp);
	}
	pathUp.add(700, 0); //end point right
	// path.fullySelected = true;
}

function initializePathDownRight(){
	pathDownRight.segments = []; 
	pathDownRight.add(900, view.size.height); //start point left
	for (var i = 1; i < pointsDownRight; i++) {
		var pointDown = new Point(700 / pointsDownRight * i + 900, center.y+350);
		pathDownRight.add(pointDown);
	}
	pathDownRight.add(2000, view.size.height); //
}

function initializePathUpRight2(){
	pathUpRight2.segments = []; 
	pathUpRight2.add(900, 0); //start point left
	for (var i = 1; i < pointsUpRight2; i++) {
		var pointUpRight2 = new Point(600 / pointsUpRight2 * i + 900, center.y-330);
		pathUpRight2.add(pointUpRight2);
	}
	pathUpRight2.add(1400, 0); //
}

function initializePathUpRight(){
	pathUpRight.segments = []; 
	pathUpRight.add(1000, 0); //start point left
	for (var i = 1; i < pointsUpRight; i++) {
		var pointUpRight = new Point(600 / pointsUpRight * i + 1000, center.y-280);
		pathUpRight.add(pointUpRight);
	}
	pathUpRight.add(1600, 0); //
}

function onFrame(event) {
	// for (var i = 0; i < balls.length - 1; i++) {
	// 	for (var j = i + 1; j < balls.length; j++) {
	// 		balls[i].react(balls[j]);
	// 	}
	// }
	// for (var i = 0, l = balls.length; i < l; i++) {
	// 	balls[i].iterate();
	// }

	for (var i = 0; i < balls.length - 1; i++) {
		for (var j = i + 1; j < balls.length; j++) {
			balls[i].react(balls[j]);
		}
	}
	for (var i = 0, l = balls.length; i < l; i++) {
		balls[i].iterate();
	}


	pathHeight += (center.y - mousePos.y - pathHeight) / 20;
	// if(mouseInteract == 1){
		for (var i = 1; i < pointsUp; i++) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 400) * pathHeight*0.2;
		var yPos = Math.sin(sinSeed / 100) * sinHeight + height-400+i*50;
		pathUp.segments[i].point.y = yPos;
		}

		for (var i = 1; i < points; i++) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 200) * pathHeight*0.2;
		var yPos = Math.sin(sinSeed / 100) * sinHeight + height+150+i*50;
		path.segments[i].point.y = yPos;
		}
	// }else{
		for (var i = 1; i < pointsDownRight; i++) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 200) * pathHeight*0.2;
		var yPos = Math.sin(sinSeed / 100) * sinHeight + height+200-i*20;
		pathDownRight.segments[i].point.y = yPos;
		}

		for (var i = 1; i < pointsUpRight2; i++) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 200) * pathHeight*0.2;
		var yPos = -Math.sin(sinSeed / 100) * sinHeight + height-270-i*50;
		pathUpRight2.segments[i].point.y = yPos;
		}

		for (var i = 1; i < pointsUpRight; i++) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 200) * pathHeight*0.2;
		var yPos = -Math.sin(sinSeed / 100) * sinHeight + height-240-i*50;
		pathUpRight.segments[i].point.y = yPos;
		}
	// }
	

	if (smooth)
		path.smooth({ type: 'continuous' });
		pathUp.smooth({ type: 'continuous' });
		pathDownRight.smooth({ type: 'continuous' });
		pathUpRight2.smooth({ type: 'continuous' });
		pathUpRight.smooth({ type: 'continuous' });
	// path.removeSegment(0);
}

function onMouseMove(event) {
	// if (  event.point.x < view.center.x ){
	// 	mouseInteract = 1;
	// 	mousePos = event.point;
	// }else {
	// 	mouseInteract = 2;
		
	// }
	mousePos = event.point;
	
}

// Reposition the path whenever the window is resized:
function onResize(event) {
	initializePath();
	initializePathUp();
	initializePathDownRight();i
	initializePathUpRight2();
	initializePathUpRight();
}

function onMouseDown(event){
	console.log("add");
	var position = event.point;
	var vector = new Point({
		angle: 360 * Math.random(),
		length: Math.random() * 10
	});
	var radius = Math.random() * 60 + 60;
	balls.push(new Ball(radius, position, vector));
}


//--------------------- main ---------------------




