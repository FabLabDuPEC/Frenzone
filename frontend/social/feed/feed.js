'use strict';
$().ready(function() {
    var socket = io();
    var allCaughtUp = false;
    getPosts(); // Get posts as soon as page loads

    function getPosts() {
        socket.emit('request posts', 3);
    }

    socket.on('load posts', function(postArray, noMorePosts) {
        // If all posts have been loaded, stop trying to load more posts
        if (postArray.length === 0) {
            noMorePostsMessage();
        } else {
            // Create post DOM element
            addPostToDOM(post.title, post.skills, post.dateCreated, post.image);
        }
    });

    function addPostToDOM(title, skills, dateCreated, image) {
        console.log("addPostToDOM");
        console.log(image);
        // Initialize up DOM elements
        var post = $("<div class=\"post\"></div>");
        var column1 = $("<div class=\"column1\"></div>");
        var imageContainer = $("<div class=\"imageContainer\"></div>");
        var picture = $("<img class=\"image\"></img>")
        var column2 = $("<div class=\"column2\"></div>");
        var postTitle = $("<div class=\"postTitle\"></div>");
        var userName = $("<div class=\"userName\"></div>");
        var skills = $("<div class=\"skills\"></div>");
        // Add data to elements
        picture.attr("src", image);
        console.log(picture.src);
        postTitle.text(title);
        // Combine elements
        column2.append(postTitle, userName, skills);
        imageContainer.append(picture);
        column1.append(imageContainer);
        post.append(column1, column2);
        // Append post to DOM
        $("#feedContainer").append(post); // Add to DOM
    }

    function noMorePostsMessage() {
        if (!allCaughtUp) {
            console.log("All posts already loaded.")
            // Add message to DOM feed bottom
            var msg = "<div class=\"post center\" id=\"final\"><div>All posts already loaded.</div></div>";
            $("#feedContainer").append(msg);
            allCaughtUp = true;
        }
    };

    // Load more posts when at bottom of page
    if (!allCaughtUp) { // As long as there are more posts to load
        window.onscroll = function() {
            var d = document.documentElement;
            var offset = d.scrollTop + window.innerHeight;
            var height = d.offsetHeight;
            if (offset === height) {
                console.log('At the bottom');
                getPosts();
            }
        }
    };
});