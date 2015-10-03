/// <reference path="Scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="Scripts/typings/lodash/lodash.d.ts"/>

class Color {
    static Green = 'rgba(40, 210, 40, 1)';
    static Blue = 'rgba(40, 50, 220, 1)';
    static Cyan = 'rgba(30, 210, 210, 1)';

    static Red = 'rgba(210, 50, 40, 1)';
    static Yellow = 'rgba(255, 255, 40, 1)';
    static Gray = 'rgba(140, 140, 140, 1)';
    static White = 'rgba(255, 255, 255, 1)';
}

// moving bodies?

interface IPoint {
    x: number;
    y: number;
}

interface IBasic extends IPoint {
    radius: number;
}

interface IGrav extends IBasic {
    mass: number;
    color: string;
}

interface IDot extends IBasic {
    vx: number;
    vy: number;
}

interface ILevel {
    maxPower: number;
    gravs: IGrav[];
    start: IBasic;
    end: IBasic;
}

const levels: ILevel[] = [
    // 0
    {
        maxPower: 0.7,
        gravs: [
            { x: 0.5, y: 0.5, radius: 0.1, mass: 100, color: Color.Red }
        ],
        start: { x: 0.1, y: 0.1, radius: 0.05 },
        end: { x: 0.9, y: 0.9, radius: 0.05 }
    },

    // 1
    {
        maxPower: 0.5,
        gravs: [
            { x: 0.9, y: 0.1, radius: 0.05, mass: 100, color: Color.Red },
            { x: 0.1, y: 0.9, radius: 0.05, mass: 100, color: Color.Red }
        ],
        start: { x: 0.1, y: 0.1, radius: 0.05 },
        end: { x: 0.9, y: 0.9, radius: 0.05 }
    },

    // 2
    {
        maxPower: 0.5,
        gravs: [
            { x: 0.8, y: 0.5, radius: 0.2, mass: 100, color: Color.Yellow },
            { x: 0.1, y: 0.5, radius: 0.05, mass: 100, color: Color.Red }
        ],
        start: { x: 0.9, y: 0.1, radius: 0.05 },
        end: { x: 0.9, y: 0.9, radius: 0.05 }
    },

    // 3
    {
        maxPower: 1,
        gravs: [
            { x: 0.4, y: 0.7, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.5, y: 0.7, radius: 0.05, mass: 50, color: Color.Red },
            { x: 0.6, y: 0.7, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.7, y: 0.7, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.8, y: 0.7, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.9, y: 0.7, radius: 0.05, mass: 0, color: Color.Gray },

            { x: 0.1, y: 0.3, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.2, y: 0.3, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.3, y: 0.3, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.4, y: 0.3, radius: 0.05, mass: 0, color: Color.Gray },
            { x: 0.5, y: 0.3, radius: 0.05, mass: 50, color: Color.Red },
            { x: 0.6, y: 0.3, radius: 0.05, mass: 0, color: Color.Gray },
        ],
        start: { x: 0.5, y: 0.9, radius: 0.05 },
        end: { x: 0.5, y: 0.1, radius: 0.05 }
    },
];

var levelNumber = 0;
var level: ILevel;

var dots: IDot[] = [];

// constants
const dotRadius = 0.01;
// Unused for now -- possibly give dots mass later for combo dots that affect each other?
const dotMass = 10;

var lastTimestamp: number;

var body: JQuery;
var canvas: HTMLCanvasElement;
var context: CanvasRenderingContext2D;

$(document).ready(function () {
    body = $(document.body);

    document.ontouchmove = function (event) {
        event.preventDefault();
    };

    canvas = document.createElement('canvas');

    body.mousedown(function (e) { startDot(e.pageX, e.pageY); });
    body.on("touchstart", function (e) { startDot((<TouchEvent>e.originalEvent).touches[0].pageX, (<TouchEvent>e.originalEvent).touches[0].pageY); });

    body.mousemove(function (e) { moveDot(e.pageX, e.pageY); });
    body.on("touchmove", function (e) { moveDot((<TouchEvent>e.originalEvent).touches[0].pageX, (<TouchEvent>e.originalEvent).touches[0].pageY); });

    body.mouseup(function (e) { endDot(); });
    body.on("touchend", function (e) { endDot(); });

    body.append(canvas);

    context = canvas.getContext('2d');

    rebuild();

    resize();

    lastTimestamp = performance.now();
    window.requestAnimationFrame(tickFunc);
});

$(window).resize(function () {
    resize();
});

function rebuild() {
    dots = [];

    level = levels[levelNumber];

    body.css('cursor', 'auto');
}

function nextLevel() {
    levelNumber++;

    if (levelNumber >= levels.length) {
        alert('You beat all the levels. Tell David to make some more.');
        levelNumber = 0;
    }

    rebuild();
}

function pageToCoord(pt: IPoint): IPoint {
    return {
        x: (pt.x - base.x) / baseSize,
        y: (pt.y - base.y) / baseSize
    };
}

var baseSize = 0, base: IPoint;
function resize() {
    var bWidth = body.width(), bHeight = body.height();
    if (bHeight >= bWidth) {
        // taller than wide
        base = { x: 0, y: (bHeight - bWidth) / 2 };
    } else {
        base = { x: (bWidth - bHeight) / 2, y: 0 };
    }

    baseSize = Math.min(bWidth, bHeight);

    $(canvas).css({ top: base.y + 'px', height: baseSize + 'px', left: base.x + 'px', width: baseSize + 'px' });
    canvas.width = canvas.height = baseSize;
}

var dotStart: IPoint, dotEnd: IPoint;
function startDot(x: number, y: number) {
    var pt = pageToCoord({ x: x, y: y });

    if (Math.pow(pt.y - level.start.y, 2) + Math.pow(pt.x - level.start.x, 2) <= level.start.radius * level.start.radius) {
        dotEnd = dotStart = pt;
    }
}

function moveDot(x: number, y: number) {
    var pt = pageToCoord({ x: x, y: y });

    var distSquared = (Math.pow(pt.x - level.start.x, 2) + Math.pow(pt.y - level.start.y, 2));
    if (distSquared < level.start.radius * level.start.radius) {
        body.css('cursor', 'pointer');
    } else {
        body.css('cursor', 'auto');
    }

    if (!dotStart) {
        return;
    }

    dotEnd = pt;

    var nv: IPoint = { x: 5 * (dotEnd.x - dotStart.x), y: 5 * (dotEnd.y - dotStart.y) };

    var mag = Math.sqrt(nv.y * nv.y + nv.x * nv.x);
    if (mag > level.maxPower) {
        nv.x /= (mag / level.maxPower);
        nv.y /= (mag / level.maxPower);

        dotEnd = { x: dotStart.x + nv.x / 5, y: dotStart.y + nv.y / 5 };
    }
}

function endDot() {
    if (!dotStart) {
        return;
    }

    var nv: IPoint = { x: 5 * (dotEnd.x - dotStart.x), y: 5 * (dotEnd.y - dotStart.y) };

    var newDot = {
        x: dotStart.x,
        y: dotStart.y,
        vx: nv.x,
        vy: nv.y,
        radius: dotRadius
    };
    dots.push(newDot);

    dotStart = dotEnd = null;
}

function tickFunc(timestamp: number) {
    var dT = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    for (var i = 0; i < dots.length;) {
        var dot = dots[i];

        // calculate new x/y from vx/vy
        dot.x += dot.vx * dT;
        dot.y += dot.vy * dT;

        if (dot.x < 0 || dot.y < 0 || dot.x >= 1.0 || dot.y >= 1.0) {
            // dead
            dots.splice(i, 1);
            continue;
        }

        // calculate new vx/vy
        var aX = 0, aY = 0;
        var swallowed = false;

        for (var h = 0; h < level.gravs.length; h++) {
            var grav = level.gravs[h];

            var distSquared = (Math.pow(grav.x - dot.x, 2) + Math.pow(grav.y - dot.y, 2));

            if (distSquared < grav.radius * grav.radius) {
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
            continue;
        }

        if (Math.pow(level.end.x - dot.x, 2) + Math.pow(level.end.y - dot.y, 2) < level.end.radius * level.end.radius) {
            // success!
            dots.splice(i, 1);

            nextLevel();

            break;
        }

        dot.vx += dT * aX;
        dot.vy += dT * aY;

        i++;
    }

    window.requestAnimationFrame(tickFunc);

    render();
}

function render() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(baseSize, baseSize);

    context.clearRect(0, 0, 1, 1);

    fillCircle(level.start, level.start.radius + 0.003 * Math.sin(lastTimestamp / 300), Color.Green);
    fillCircle(level.end, level.end.radius + 0.003 * Math.sin(Math.PI / 2 + lastTimestamp / 300), Color.Blue);

    for (var i = 0; i < level.gravs.length; i++) {
        var grav = level.gravs[i];

        fillCircle(grav, grav.radius, grav.color);
    }

    for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];

        var angle = Math.atan2(dot.vy, dot.vx);

        context.beginPath();
        context.moveTo(dot.x + dot.radius * Math.cos(angle), dot.y + dot.radius * Math.sin(angle));
        context.lineTo(dot.x + dot.radius * Math.cos(angle + 3 * Math.PI / 4), dot.y + dot.radius * Math.sin(angle + 3 * Math.PI / 4))
        context.lineTo(dot.x + dot.radius * Math.cos(angle + 5 * Math.PI / 4), dot.y + dot.radius * Math.sin(angle + 5 * Math.PI / 4));
        context.lineTo(dot.x + dot.radius * Math.cos(angle), dot.y + dot.radius * Math.sin(angle));
        context.fillStyle = Color.White;
        context.fill();
        context.strokeStyle = Color.White;
        context.stroke();
    }

    if (dotStart && dotEnd && (dotStart.x != dotEnd.x || dotStart.y != dotEnd.y)) {
        drawArrow(dotStart, dotEnd, 0.01, Color.Red, 0.003);
    }

    context.setTransform(1, 0, 0, 1, 0, 0);

    // font rendering is messed up with a scale transform :(
    context.font = (baseSize / 30) + 'px arial';
    context.textBaseline = 'top';
    context.textAlign = 'right';
    context.fillStyle = 'white';
    context.fillText('Level ' + (levelNumber + 1), baseSize, 0);

    if (levelNumber === 0) {
        // noob help
        context.font = (baseSize / 40) + 'px arial';
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.fillStyle = 'black';

        context.fillText(dotStart ? 'Drag' : 'Start', level.start.x * baseSize, level.start.y * baseSize);

        context.fillText('Target', level.end.x * baseSize, level.end.y * baseSize);
    }
}

function fillCircle(pt: IPoint, radius: number, color: string) {
    context.beginPath();
    context.arc(pt.x, pt.y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
}

function drawArrow(pt1: IPoint, pt2: IPoint, headSize: number, color: string, thickness: number) {
    var angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);

    context.beginPath();
    context.moveTo(pt1.x, pt1.y);
    context.lineTo(pt2.x, pt2.y);
    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.stroke();

    context.beginPath();
    context.moveTo(pt2.x, pt2.y);
    context.lineTo(pt2.x + headSize * Math.cos(angle + 3 * Math.PI / 4), pt2.y + headSize * Math.sin(angle + 3 * Math.PI / 4));
    context.lineTo(pt2.x + headSize * Math.cos(angle + 5 * Math.PI / 4), pt2.y + headSize * Math.sin(angle + 5 * Math.PI / 4));
    context.lineTo(pt2.x, pt2.y);
    context.fillStyle = color;
    context.fill();
}
