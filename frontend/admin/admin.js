"use strict";
// Socket.io
var socket;
var accompanyingCount = null;
var userID = null;
$(document).ready(function() {
    socket = io();
    $(".payButton").on("click", () => console.log("paid"));
    $("#addRegisteredVisitorButton").on("click", submitRegisteredVisitors);
    $("#visits").on("click", function() { socket.emit("generate visits csv") });
    $("#anon").on("click", function() { socket.emit("generate anon csv") });
    $("#members").on("click", () => { socket.emit("generate members CSV") });
    $("#unregisteredVisitorsButton").on("click", submitUnregisteredVisitors);
    $("#refreshStatsButton").on("click", () => socket.emit("refresh stats"));
    socket.on("new stats", loadStats);
    socket.on("members list", loadMembers);
    socket.on("visits csv data", createDownloadableCSV);
    socket.on("anon csv data", createDownloadableCSV);
    socket.on("members csv data", createDownloadableCSV);
    socket.on("unregistered visits saved", alertUnregisteredVisitsSaved);
    $("#refreshStatsButton").click();
    socket.emit('load member list');
});

function loadMembers(membersList) {
    if (membersList != null) {
        var select = $("#memberList");
        var defaultOption = $("#default");
        defaultOption.remove();
        // Create DOM elements for all members
        for (var i = 0; i < membersList.length; i++) {
            // Create DOM element
            var option = $("<option>").attr("value", membersList[i].userID).text(membersList[i].name);
            // Append DOM elements to DOM select element
            select.append(option);
        }
    }
}

function submitRegisteredVisitors() {
    if ($("#default").length === 0) { // If the default option has already been removed from DOM, then Members list has been loaded
        var memberID = $("#memberList").val(); // get userID
        var accompanyingCount = $("#accompanyingCount").val();
        socket.emit('save registered visit', memberID, accompanyingCount);
    }
}

function submitUnregisteredVisitors() {
    var count = $("#unregisteredVisitorsCount").val();
    if (count > 0) {
        socket.emit("save unregistered visit", count);
    } else {
        alert("Pas capable d'ajouter " + count + " visites au base de données");
    }
}

function loadStats(stats) {
    $("#date").html(stats.date);
    if (stats.status === false) {
        console.log("no visits so far today");
        $("#registeredVisitors").html(0);
        $("#unregisteredVisitors").html(0);
        $("#avgResearchProduction").html("-");
        $("#avgPersonalProfessional").html("-");
    } else {
        // Load total stats table
        console.log("stats received");
        $("#registeredVisitors").html(stats.registeredVisitors);
        $("#unregisteredVisitors").html(stats.unregisteredVisitors);
        $("#avgResearchProduction").html(stats.researchProduction);
        $("#avgPersonalProfessional").html(stats.personalProfessional);
        // Load visitor table
        loadVisits(stats.loginsToday);
    }

}

function loadVisits(loginsArray) {
    if (loginsArray.length > 0) {
        $("#emptyRow").hide();
        $(".visitorRows").remove();
        for (var i = 0; i < loginsArray.length; i++) {
            var row = $('<tr>').addClass('visitorRows'); // create row
            // create data cells
            var name = $('<td>').addClass('nameCell').text(loginsArray[i].firstName + ' ' + loginsArray[i].lastName);
            var email = "<div class='tooltip'>📧<span class='tooltiptext'>" + loginsArray[i].email + "</span></div>";
            var phone = "<div class='tooltip'>📞<span class='tooltiptext'>" + loginsArray[i].phone + "</span></div>";
            if (loginsArray[i].lastPaidMembership) {
                var pay = "<div class='tooltip payButton' data-id='" + loginsArray[i].userID + "'>💸<span class='tooltiptext'>" + loginsArray[i].lastPaidMembership + " jours" + "</span></div>";
                var contact = $('<td>').addClass('contactCell').html(email + phone + pay);
            } else { var contact = $('<td>').addClass('contactCell').html(email + phone); }
            var accompanied = $('<td>').addClass('accompaniedCell').text(loginsArray[i].accompanied);
            var time = $('<td>').addClass('timeCell').text(new Date(loginsArray[i].time).toTimeString().substring(0, 5));
            row.append(name, contact, accompanied, time); // Append cells to row
            $('#visitorListTable').append(row); // Append row to table;
        }
        $(".payButton").on("click", () => {
            console.log("sending membership payment update to server");
        });
    } else {
        $("#emptyRow").show() // If there are no logins
    }
}

function alertUnregisteredVisitsSaved(count) {
    alert(count + " unregistered visits saved.");
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
    link.download = fileName;

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};