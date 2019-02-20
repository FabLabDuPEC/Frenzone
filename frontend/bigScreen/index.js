"use strict";
var socket;
$().ready(function() {
    socket = io();
    socket.on("big screen login event", shootFirework);
    setInterval(shootFirework, 400);
});

function shootFirework() {
    var colors = ["red", "blue", "yellow", "green", "purple", "orange", "cyan", "magenta"];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var x = randomFloatBetween(-6, 6);
    var y = randomFloatBetween(-1, 4.5);
    var z = randomFloatBetween(-2, -4);
    var rx = randomFloatBetween(0, 180);
    var ry = randomFloatBetween(0, 180);
    var rz = randomFloatBetween(0, 180);
    var position = x + " " + y + " " + z;
    var rotation = rx + " " + ry + " " + rz;
    var firework = $('<a-entity geometry="primitive: box" material="color:' + color + '" position="'+ position + '" rotation="' + rotation + '"></a-entity>');
    var scene = $("#scene");
    scene.append(firework);
}
// Random float between
function randomFloatBetween(minValue, maxValue, precision) {
    if (typeof(precision) == 'undefined') {
        precision = 2;
    }
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)), maxValue).toFixed(precision));
}