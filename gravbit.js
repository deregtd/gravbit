var colorGreen = 'rgba(40, 210, 40, 1)';
var colorBlue = 'rgba(40, 50, 220, 1)';
var colorCyan = 'rgba(30, 210, 210, 1)';

var colorRed = 'rgba(210, 50, 40, 1)';
var colorYellow = 'rgba(255, 255, 40, 1)';
var colorGray = 'rgba(140, 140, 140, 1)';

// moving bodies?

var levels = [
	// 0
	{
		maxPower: 0.7,
		gravs: [
			{ x: 0.5, y: 0.5, radius: 0.1, mass: 100, color: colorRed }
		],
		start: { x: 0.1, y: 0.1, radius: 0.05 },
		end: { x: 0.9, y: 0.9, radius: 0.05 }
	},

	// 1
	{
		maxPower: 0.5,
		gravs: [
			{ x: 0.9, y: 0.1, radius: 0.05, mass: 100, color: colorRed },
			{ x: 0.1, y: 0.9, radius: 0.05, mass: 100, color: colorRed }
		],
		start: { x: 0.1, y: 0.1, radius: 0.05 },
		end: { x: 0.9, y: 0.9, radius: 0.05 }
	},

	// 2
	{
		maxPower: 0.5,
		gravs: [
			{ x: 0.8, y: 0.5, radius: 0.2, mass: 100, color: colorYellow },
			{ x: 0.1, y: 0.5, radius: 0.05, mass: 100, color: colorRed }
		],
		start: { x: 0.9, y: 0.1, radius: 0.05 },
		end: { x: 0.9, y: 0.9, radius: 0.05 }
	},

	// 3
	{
		maxPower: 1,
		gravs: [
			{ x: 0.4, y: 0.7, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.5, y: 0.7, radius: 0.05, mass: 50, color: colorRed },
			{ x: 0.6, y: 0.7, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.7, y: 0.7, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.8, y: 0.7, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.9, y: 0.7, radius: 0.05, mass: 0, color: colorGray },

			{ x: 0.1, y: 0.3, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.2, y: 0.3, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.3, y: 0.3, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.4, y: 0.3, radius: 0.05, mass: 0, color: colorGray },
			{ x: 0.5, y: 0.3, radius: 0.05, mass: 50, color: colorRed },
			{ x: 0.6, y: 0.3, radius: 0.05, mass: 0, color: colorGray },
		],
		start: { x: 0.5, y: 0.9, radius: 0.05 },
		end: { x: 0.5, y: 0.1, radius: 0.05 }
	},
];

var level = 0;

var gravs, start, end, maxPower;
var dots = [];

// constants
var dotRadius = 0.01;
// Unused for now -- possibly give dots mass later for combo dots that affect each other?
var dotMass = 10;

var lastTimestamp;

var body, canvas, context;
$( document ).ready(function() {
	body = $(document.body);

	document.ontouchmove = function(event){
		event.preventDefault();
	};

	canvas = $('<canvas />');

	body.mousedown(function(e) { startDot(e.pageX, e.pageY); });
	body.on("touchstart", function(e) { startDot(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY); });

	body.mousemove(function(e) { moveDot(e.pageX, e.pageY); });
	body.on("touchmove", function(e) { moveDot(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY); });

	body.mouseup(function(e) { endDot(); });
	body.on("touchend", function(e) { endDot(); });
	
	body.append(canvas);

	context = canvas[0].getContext('2d');

	rebuild();

	resize();

	lastTimestamp = performance.now();
	window.requestAnimationFrame(tickFunc);
});

$(window).resize(function() {
	resize();
});

function rebuild() {
	dots = [];

	// build level
	start = levels[level].start;
	end = levels[level].end;
	gravs = levels[level].gravs;
	maxPower = levels[level].maxPower;
}

function nextLevel() {
	level++;

	if (level >= levels.length) {
		alert('You beat all the levels. Tell David to make some more.');
		level = 0;
	}

	rebuild();
}

var baseSize = 0, baseX = 0, baseY = 0;
function resize() {
	var bWidth = body.width(), bHeight = body.height();
	if (bHeight >= bWidth) {
		// taller than wide
		baseX = 0;
		baseY = ((bHeight - bWidth) / 2);
	} else {
		baseX = ((bWidth - bHeight) / 2);
		baseY = 0;
	}

	baseSize = Math.min(bWidth, bHeight);

	canvas.css({ top: baseY + 'px', height: baseSize + 'px', left: baseX + 'px', width: baseSize + 'px' });
	canvas[0].width = canvas[0].height = baseSize;

	context.scale(baseSize, baseSize);
}

var dotStartX, dotStartY, dotEndX, dotEndY;
function startDot(x, y) {
	var tx = (x - baseX) / baseSize;
	var ty = (y - baseY) / baseSize;

	if (Math.pow(ty - start.y, 2) + Math.pow(tx - start.x, 2) <= start.radius*start.radius)
	{
		dotStartX = tx;
		dotStartY = ty;
	}
}

function moveDot(x, y) {
	if (!dotStartX) {
		return;
	}

	dotEndX = (x - baseX) / baseSize;
	dotEndY = (y - baseY) / baseSize;

	var nvx = 5*(dotEndX - dotStartX);
	var nvy = 5*(dotEndY - dotStartY);
	
	var mag = Math.sqrt(nvy*nvy + nvx*nvx);
	if (mag > maxPower)
	{
		nvx /= (mag / maxPower);
		nvy /= (mag / maxPower);

		dotEndX = dotStartX + nvx/5;
		dotEndY = dotStartY + nvy/5;
	}
}

function endDot() {
	if (!dotStartX) {
		return;
	}

	var nvx = 5*(dotEndX - dotStartX);
	var nvy = 5*(dotEndY - dotStartY);

	var newDot = {
		x: dotStartX,
		y: dotStartY,
		vx: nvx,
		vy: nvy,
		obj: $('<div class="dot" />'),
		radius: dotRadius
	};
	dots.push(newDot);

	dotStartX = dotStartY = null;
	dotEndX = dotEndY = null;
}

function tickFunc(timestamp) {
	var dT = (timestamp - lastTimestamp)/1000;
	lastTimestamp = timestamp;

	for (var i=0; i<dots.length;)
	{
		var dot = dots[i];

		// calculate new x/y from vx/vy
		dot.x += dot.vx*dT;
		dot.y += dot.vy*dT;

		if (dot.x < 0 || dot.y < 0 || dot.x >= 1.0 || dot.y >= 1.0) {
			// dead
			dots.splice(i, 1);
			dot.obj.remove();
			continue;
		}

		// calculate new vx/vy
		var aX = 0, aY = 0;
		var swallowed = false;
		for (var h=0; h<gravs.length; h++)
		{
			var grav = gravs[h];

			var distSquared = (Math.pow(grav.x - dot.x, 2) + Math.pow(grav.y - dot.y, 2));

			if (distSquared < grav.radius*grav.radius) {
				swallowed = true;
				break;
			}

			if (grav.mass > 0) {
				var dir = Math.atan2(grav.y - dot.y, grav.x - dot.x);
				var forceOverMass = 0.001 * grav.mass / distSquared;
				aX += Math.cos(dir) * forceOverMass;
				aY += Math.sin(dir) * forceOverMass;
			}
		}

		if (swallowed) {
			// oof
			dots.splice(i, 1);
			dot.obj.remove();
			continue;
		}

		if (Math.pow(end.x - dot.x, 2) + Math.pow(end.y - dot.y, 2) < end.radius*end.radius) {
			// success!
			dots.splice(i, 1);
			dot.obj.remove();

			nextLevel();

			break;
		}

		dot.vx += dT * aX;
		dot.vy += dT * aY;

		dot.obj.css({
			left: Math.round(baseSize * (dot.x - dot.radius)) + 'px',
			top: Math.round(baseSize * (dot.y - dot.radius)) + 'px',
			width: Math.round(baseSize * 2 * dot.radius) + 'px',
			height: Math.round(baseSize * 2 * dot.radius) + 'px'
		});

		i++;
	}

	tickTimer = window.requestAnimationFrame(tickFunc);

	render();
}

function render()
{
	context.clearRect(0, 0, 1, 1);

	fillCircle(start.x, start.y, start.radius + 0.003 * Math.sin(lastTimestamp/300), colorGreen);
	fillCircle(end.x, end.y, end.radius + 0.003 * Math.sin(Math.PI/2 + lastTimestamp/300), colorBlue);

	for (var i=0; i<gravs.length; i++) {
		var grav = gravs[i];

		fillCircle(grav.x, grav.y, grav.radius, grav.color);
	}

	for (var i=0; i<dots.length; i++) {
		var dot = dots[i];

		fillCircle(dot.x, dot.y, dot.radius, colorCyan);
	}

	if (dotStartX && dotEndX) {
		drawArrow(dotStartX, dotStartY, dotEndX, dotEndY, 0.007, colorRed, 0.001);
	}
}

function fillCircle(x, y, radius, color)
{
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
}

function drawArrow(x1, y1, x2, y2, headSize, color, thickness)
{
	var angle = Math.atan2(y2-y1, x2-x1);

	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.strokeStyle = color;
	context.lineWidth = thickness;
	context.stroke();

	context.beginPath();
	context.moveTo(x2, y2);
	context.lineTo(x2 + headSize * Math.cos(angle + 3*Math.PI/4), y2 + headSize * Math.sin(angle + 3*Math.PI/4));
	context.lineTo(x2 + headSize * Math.cos(angle + 5*Math.PI/4), y2 + headSize * Math.sin(angle + 5*Math.PI/4));
	context.lineTo(x2, y2);
	context.fillStyle = color;
	context.fill();
}
