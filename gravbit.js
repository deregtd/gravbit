var colorRed = 'rgba(255, 50, 40, 0.7)';
var colorYellow = 'rgba(255, 255, 40, 0.7)';
var colorGray = 'rgba(255, 255, 255, 0.5)';

// moving bodies?

var levels = [
	// 0
	{
		maxPower: 0.7,
		gravs: [
			{ x: 0.5, y: 0.5, radius: 0.1, mass: 100, color: colorRed, obj: null }
		],
		start: { x: 0.1, y: 0.1, radius: 0.05, obj: null },
		end: { x: 0.9, y: 0.9, radius: 0.05, obj: null }
	},

	// 1
	{
		maxPower: 0.5,
		gravs: [
			{ x: 0.9, y: 0.1, radius: 0.05, mass: 100, color: colorRed, obj: null },
			{ x: 0.1, y: 0.9, radius: 0.05, mass: 100, color: colorRed, obj: null }
		],
		start: { x: 0.1, y: 0.1, radius: 0.05, obj: null },
		end: { x: 0.9, y: 0.9, radius: 0.05, obj: null }
	},

	// 2
	{
		maxPower: 0.5,
		gravs: [
			{ x: 0.8, y: 0.5, radius: 0.2, mass: 100, color: colorYellow, obj: null },
			{ x: 0.1, y: 0.5, radius: 0.05, mass: 100, color: colorRed, obj: null }
		],
		start: { x: 0.9, y: 0.1, radius: 0.05, obj: null },
		end: { x: 0.9, y: 0.9, radius: 0.05, obj: null }
	},

	// 3
	{
		maxPower: 1,
		gravs: [
			{ x: 0.4, y: 0.7, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.5, y: 0.7, radius: 0.05, mass: 50, color: colorRed, obj: null },
			{ x: 0.6, y: 0.7, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.7, y: 0.7, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.8, y: 0.7, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.9, y: 0.7, radius: 0.05, mass: 0, color: colorGray, obj: null },

			{ x: 0.1, y: 0.3, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.2, y: 0.3, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.3, y: 0.3, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.4, y: 0.3, radius: 0.05, mass: 0, color: colorGray, obj: null },
			{ x: 0.5, y: 0.3, radius: 0.05, mass: 50, color: colorRed, obj: null },
			{ x: 0.6, y: 0.3, radius: 0.05, mass: 0, color: colorGray, obj: null },
		],
		start: { x: 0.5, y: 0.9, radius: 0.05, obj: null },
		end: { x: 0.5, y: 0.1, radius: 0.05, obj: null }
	},
];

var level = 0;

var gravs, start, end, maxPower;
var dots = [];

// constants
var dotRadius = 0.01;
// Unused for now -- possibly give dots mass later for combo dots that affect each other?
var dotMass = 10;

var tickTimer = null;

var body, main;
$( document ).ready(function() {
	body = $(document.body);

	body.mousedown(function(e) { startDot(e.pageX, e.pageY); });
	body.on("touchstart", function(e) { startDot(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY); });

	body.mouseup(function(e) { endDot(e.pageX, e.pageY); });
	body.on("touchend", function(e) { endDot(e.originalEvent.changedTouches[0].pageX, e.originalEvent.changedTouches[0].pageY); });

	document.ontouchmove = function(event){
		event.preventDefault();
	};

	rebuild();
});

$(window).resize(function() {
	build();
});

var baseSize = 0, baseX = 0, baseY = 0;
function rebuild() {
	dots = [];
	main = null;
	$(document.body).empty();
	if (tickTimer) {
		window.cancelAnimationFrame(tickTimer);
		tickTimer = null;
	}

	// build level
	start = levels[level].start;
	start.obj = null;
	end = levels[level].end;
	end.obj = null;
	gravs = levels[level].gravs;
	for (var i=0; i<gravs.length; i++) {
		gravs[i].obj = null;
	}
	maxPower = levels[level].maxPower;

	build();
}

function nextLevel() {
	level++;

	if (level >= levels.length) {
		alert('You beat all the levels. Tell David to make some more.');
		level = 0;
	}

	rebuild();
}

function build() {
	if (!main)
	{
		main = $('<div id="main" />');
		body.append(main);
	}

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
	main.css({ top: baseY + 'px', height: baseSize + 'px', left: baseX + 'px', width: baseSize + 'px' });

	if (!start.obj) {
		start.obj = $('<div class="start" />');
		main.append(start.obj);
	}

	start.obj.css({
		left: Math.round(baseSize * (start.x - start.radius)) + 'px',
		top: Math.round(baseSize * (start.y - start.radius)) + 'px',
		width: Math.round(baseSize * 2 * start.radius) + 'px',
		height: Math.round(baseSize * 2 * start.radius) + 'px'
	});

	if (!end.obj) {
		end.obj = $('<div class="end" />');
		main.append(end.obj);
	}

	end.obj.css({
		left: Math.round(baseSize * (end.x - end.radius)) + 'px',
		top: Math.round(baseSize * (end.y - end.radius)) + 'px',
		width: Math.round(baseSize * 2 * end.radius) + 'px',
		height: Math.round(baseSize * 2 * end.radius) + 'px'
	});

	for (var i=0; i<gravs.length; i++) {
		var grav = gravs[i];

		if (!grav.obj) {
			grav.obj = $('<div class="grav" />');
			grav.obj.css({'background-color': grav.color});
			main.append(grav.obj);
		}

		grav.obj.css({
			left: Math.round(baseSize * (grav.x - grav.radius)) + 'px',
			top: Math.round(baseSize * (grav.y - grav.radius)) + 'px',
			width: Math.round(baseSize * 2 * grav.radius) + 'px',
			height: Math.round(baseSize * 2 * grav.radius) + 'px'
		});
	}
}

var dotStartX, dotStartY;
function startDot(x, y) {
	var tx = (x - baseX) / baseSize;
	var ty = (y - baseY) / baseSize;

	if (Math.pow(ty - start.y, 2) + Math.pow(tx - start.x, 2) <= start.radius*start.radius)
	{
		dotStartX = tx;
		dotStartY = ty;
	}
}

function endDot(x, y) {
	if (!dotStartX) {
		return;
	}

	var dotEndX = (x - baseX) / baseSize;
	var dotEndY = (y - baseY) / baseSize;

	var nvx = 5*(dotEndX - dotStartX);
	var nvy = 5*(dotEndY - dotStartY);
	
	var mag = Math.sqrt(nvy*nvy + nvx*nvx);
	if (mag > maxPower)
	{
		nvx /= (mag / maxPower);
		nvy /= (mag / maxPower);
	}

	var newDot = {
		x: dotStartX,
		y: dotStartY,
		vx: nvx,
		vy: nvy,
		obj: $('<div class="dot" />'),
		radius: dotRadius
	};
	main.append(newDot.obj);
	dots.push(newDot);

	dotStartX = dotStartY = null;

	if (!tickTimer)	{
		tickTimer = window.requestAnimationFrame(tickFunc);
		lastTimestamp = performance.now();
	}
}

var lastTimestamp;
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

			return;
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

	if (dots.length) {
		tickTimer = window.requestAnimationFrame(tickFunc);
	} else {
		tickTimer = null;
	}
}
