"use strict";
// Socket.io
var socket;
var accompanyingCount = null;
var userID = null;
$(document).ready(function() {
    socket = io();
    $("#visits").on("click", function() { socket.emit("generate visits csv") });
    $("#anon").on("click", function() { socket.emit("generate anon csv") });
    var unregisteredButton = $("#unregisteredVisitorsButton");
    unregisteredButton.click(submitUnregisteredVisitors);
    socket.on("visits csv data", createDownloadableCSV);
    socket.on("anon csv data", createDownloadableCSV)
    if()
});

function submitUnregisteredVisitors(){
    var count = $("#unregisteredVisitorsCount").val();
    socket.emit("save unregistered visit", count);
}

function createDownloadableCSV(CSV, fileName) {
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};