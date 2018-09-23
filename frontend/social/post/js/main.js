'use strict';
$().ready(function() {
    // GETUSERMEDIA ACTIVATE camera
    // Defines what media we're capturing. In this case no audio
    const mediaStreamConstraints = {
        video: true,
    };

    // Get access to DOM elements
    const localVideoJS = document.getElementById('video');
    const localVideoJQ = $("#video");
    const cameraContainer = document.getElementById("cameraContainer");
    const captionContainer = document.getElementById("captionContainer");
    const capture = document.getElementById('capture');
    const preview = document.getElementById("preview"); // select element where png will be drawn
    const canvas = document.getElementById("canvas");
    const cameraControls = $("#cameraControls");
    const reset = $("#reset");
    const captionButton = document.getElementById("captionButton");
    const postButton = $("#postButton");
    var hueRange = $("#hue");
    const titleField = $("#titleField");
    const skillsField = $("#skillsField");

    // Initialize DOM objects
    fillPreview("#FFF");
    $("#overlay").click(function() { $("#overlay").toggle() }); // Add listener to dismiss overlay
    $(captionContainer).toggle();

    // Initialize data: size and streaming status
    var streaming = false;
    var width = 640; // We will scale the photo width to this
    // var height = 500;
    var height = 0; // This will be computed based on the input stream
    var gifInterval = 300; // Defines interval between GIF frames in milliseconds
    hueRange.val(0);

    // Local stream that will be reproduced on the video
    let localStream;

    //If successful, adds MediaStream to the video element
    function gotLocalMediaStream(mediaStream) {
        localStream = mediaStream;
        localVideoJS.srcObject = mediaStream;
    }

    // Handles error by logging to console
    function handleLocalMediaStreamError(error) {
        console.log('navigator.getUserMedia error: ', error);
    }

    // Initializes media stream
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then(gotLocalMediaStream).catch(handleLocalMediaStreamError);

    localVideoJS.addEventListener('canplay', function(ev) {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width); // Set height as a function of aspect ratio
            localVideoJS.setAttribute('width', width);
            localVideoJS.setAttribute('height', height);
            canvas.width = width; // To modify canvas dimensions: canvas.width, canvas,height
            canvas.height = height;
            preview.setAttribute('width', width);
            preview.setAttribute('height', height);
            capture.setAttribute('width', width);
            cameraControls.height(cameraContainer.offsetHeight);
            $(captionContainer).width(width);
            $(captionContainer).height(cameraContainer.offsetHeight);
            captionButton.setAttribute('width', width);
            streaming = true;
            initializeHueSlider();
        }
    }, false);

    // Initialize Socket
    var socket;
    socket = io();

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.
    var picArray = [];

    function takepicture() {
        const context = canvas.getContext('2d');
        // Apply cameraStream's filters to new canvas' context's filter
        // all subsequent drawing operations will have this filter applied
        context.filter = localVideoJQ.css("filter");
        // canvas.style.width = localVideoJQ.css("width");
        // canvas.style.height = localVideoJQ.css("height");
        // Draw the video frame to the canvas.
        context.drawImage(localVideoJS, 0, 0, canvas.width, canvas.height);
        // Convert Canvas to PNG and draw to DOM  
        var data = canvas.toDataURL('image/png');
        picArray.push(data); // Push image to picArray
        if (picArray.length === 1) { // Start slideshow
            slideshow();
        }
    };

    function fillPreview(color) { // Pass color as hex value eg #FFFFFF
        // if (width && height) {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext('2d');
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        var fill = canvas.toDataURL('image/png');
        preview.setAttribute('src', fill);
        // }
    }

    function fillPreviewProcessingMsg() {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext('2d');
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        // TKTKTK fill background with currentFrame, so context is preserved for user
        // var image = new Image();
        // image.addEventListener('load', function() {
        //     canvas.width = image.width;
        //     canvas.height = image.height;
        //     context.drawImage(image, 0, 0, canvas.width, canvas.height);
        //     resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        // }, false);
        // image.src = URI;
        // var cFrame = context.createPattern(image, 'no-repeat');
        // context.fillStyle = cFrame;
        context.font = "540px Helvetica";
        context.textAlign = "center";
        context.fillStyle = "black";
        context.fillText("💫", (width / 2), (height / 1.15));
        context.font = "80px Helvetica";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("j'make ton gif...", (width / 2), (height / 1.8));
        var fill = canvas.toDataURL('image/png');
        preview.setAttribute('src', fill);
    }

    var currentFrame = 0;

    function slideshow() {
        if (picArray.length != 0) { // If array becomes empty, slideshow will stop looping
            if (currentFrame >= 0 && currentFrame < picArray.length) { // Show currentFrame if it is greater than zeroth element and not the ultimate frame in picArray
                preview.setAttribute('src', picArray[currentFrame++]);
            } else if (currentFrame === picArray.length) { // When at the end of the picArray, start over
                currentFrame = 0;
                preview.setAttribute('src', picArray[currentFrame++])
            }
            if (currentFrame != -1) { // When captionButton button clicked, currentFrame will be updated to -1 to stop the slideshow.
                setTimeout(slideshow, gifInterval); // So long as currentFrame does not equal -1, keep running the slideshow
            }
        } else {
            //Slideshow is not prompted to continue
        }
    }

    function makeGif() {
        currentFrame = -1;
        fillPreviewProcessingMsg();
        gifshot.createGIF({
            'frameDuration': Math.floor(gifInterval / 100),
            'gifWidth': width,
            "gifHeight": height,
            'numFrames': 20,
            'sampleInterval': 8,
            'images': picArray
        }, function(obj) {
            if (!obj.error) {
                var image = obj.image;
                preview.setAttribute('src', image); // Set Preview element to new gif
                stageGifForUpload(image);
            } else { currentFrame = 0; } //If gif making fails, start the pic slideshow up again
        });
    };

    var fileToUpload = "";

    function stageGifForUpload(file) {
        fileToUpload = file;
    }

    function post() {
        var title = titleField.val();
        var skills = skillsField.val();

        var post = {
            "title": title,
            "skills": skills,
            "URI": fileToUpload
        }
        console.log("post created and about to upload");
        console.log(post);
        socket.emit('post gif', post);
    }


    // BUTTONS
    //Listen for publish button
    capture.addEventListener('click', function(ev) {
        takepicture();
        ev.preventDefault();
    }, false);

    reset.click(function() {
        picArray.length = 0; // Empty the array.
        currentFrame = 0;
        fillPreview("#FFFFFF"); // Fill preview element with white
        hueRange.focus(); // Move focus away from reset button (so that pressing spacebar does not "reset" again)
    })

    $(captionButton).click(function() {
        if (picArray.length === 0) { // Do not allow user to proceed if no pics have been taken
            alert("take a picture before makinga gif");
        } else {
            makeGif();
            // When caption button is pressed, hide camera container and show caption container
            $(cameraContainer).toggle();
            $(cameraControls).toggle();
            $(captionContainer).toggle();
        }
    });

    postButton.click(function() {
        post();
    })

    // Spacebar triggers Capture button
    $("body").keydown(spaceBarPressed);

    function spaceBarPressed(event) {
        var x = event.keyCode;
        if (x == 32) {
            capture.click();
        }
    }

    // UI 
    // Hue Slider
    function initializeHueSlider() {
        var hueRange = $("#hue");
        var saturation = "saturate(500%)";

        localVideoJQ.css("filter", saturation);

        hueRange.on('input', function() {
            var hueVal = hueRange.val();
            var newHue = "hue-rotate(" + hueVal + "deg)";
            localVideoJQ.css("filter", newHue + saturation);
        })
    }
});