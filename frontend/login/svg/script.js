var topLeft = new Point(100, 100);
var bottomRight = new Point(600, 600);

// should probably use the midpoints between these points to determine the position of the text labels

var color1 = new Color(0.3, 1, 1, 0.45); // light blue semi opaque;
var color2 = new Color(0.5, 1, 1, 0); // transparent blue

var rect1 = new Path.Rectangle({
    topLeft: topLeft,
    bottomRight: bottomRight,
    fillColor: {
        gradient: {
            stops: ['#ffc5f8', '#ffffbf']
        },
        origin: new Point(0, 250),
        destination: new Point(500, 250)
    }
});

var rect2 = new Path.Rectangle({
    topLeft: topLeft,
    bottomRight: bottomRight,
    fillColor: {
        gradient: {
            stops: [color1, color2]
        },
        origin: new Point(250, 500),
        destination: new Point(250, 0)
    }
});


//text
var perso = new PointText({
    point: [250, 100],
    content: 'personnel',
    fontFamily: 'Helvetica',
    fontWeight: 'Bold',
    fontSize: 60,
    rotation: -4
});

var production = new PointText({

    point: [460, 420],
    content: 'production',
    fontFamily: 'Helvetica',
    fontWeight: 'Bold',
    fontSize: 60,
    rotation: -2
});

var recherche = new PointText({
    point: [10, 350],
    content: 'recherche',
    fontFamily: 'Helvetica',
    fontWeight: 'Bold',
    fontSize: 55,
    rotation: 3
});

var professionel = new PointText({
    point: [200, 627],
    content: 'professionel',
    fontFamily: 'Helvetica',
    fontWeight: 'Bold',
    fontSize: 60,
    rotation: 1
});

var dot = new Path.Circle({
    center: view.center,
    radius: 9,
    strokeColor: new Color(1, 0, 0.7, 1),
    strokeWidth: 3
});

var transparentRect = new Path.Rectangle({
    topLeft: topLeft,
    bottomRight: bottomRight,
    fillColor: new Color(1, 0, 0, 0.01)
});

transparentRect.onMouseMove = function(event) {
    dot.position = event.point;
};

transparentRect.onMouseDown = function(event) {
    console.log(event.point);
    var researchProduction = Math.floor((event.point.x - 100) / 5);
    var personalProfessional = Math.floor((event.point.y - 100) / 5);
    console.log(researchProduction + ", " + personalProfessional);
    if (typeof selectVisitPurpose === "function") {
        selectVisitPurpose(researchProduction, personalProfessional)
    }
}

// tool.minDistance = 10;

// var path;
// var path2;
// var path3;

// function onMouseDown(event) {
//     path = new Path();
//     var color = randomColor();
//     path.strokeColor = color;
//     path.strokeWidth = 4;
//     path.strokeCap = 'round';
//     path.add(event.point);
//     path2 = new Path;
//     path2.strokeColor = color;
//     path2.strokeWidth = 4;
//     var offset = event.point + 10;
//     path2.add(offset);
//     path3 = new Path();
//     path3.strokeWidth = 4;
//     path3.strokeColor = color;
//     path3.add(offset+10);
// }

// function onMouseDrag(event) {
//     path.add(event.point);
//     path2.add(event.point + 10);
//     path3.add(event.point + 20);
// }

// function randomColor() {
//     return '#' + Math.floor(Math.random() * 16777215).toString(16);
// }