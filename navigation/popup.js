// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Global variable containing the query we'd like to pass to Flickr. In this
 * case, kittens!
 *
 * @type {string}
 */
var QUERY = 'car';

var kittenGenerator = {
    /**
     * Flickr URL that will give us lots and lots of whatever we're looking for.
     *
     * See http://www.flickr.com/services/api/flickr.photos.search.html for
     * details about the construction of this URL.
     *
     * @type {string}
     * @private
     */
    searchOnFlickr_: 'https://secure.flickr.com/services/rest/?' +
        'method=flickr.photos.search&' +
        'api_key=90485e931f687a9b9c2a66bf58a3861a&' +
        'text=' + encodeURIComponent(QUERY) + '&' +
        'safe_search=1&' +
        'content_type=1&' +
        'sort=interestingness-desc&' +
        'per_page=20',

    /**
     * Sends an XHR GET request to grab photos of lots and lots of kittens. The
     * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
     *
     * @public
     */
    requestKittens: function() {
        var req = new XMLHttpRequest();
        req.open("GET", this.searchOnFlickr_, true);
        req.onload = this.showPhotos_.bind(this);
        req.send(null);
    },

    /**
     * Handle the 'onload' event of our kitten XHR request, generated in
     * 'requestKittens', by generating 'img' elements, and stuffing them into
     * the document for display.
     *
     * @param {ProgressEvent} e The XHR ProgressEvent.
     * @private
     */
    showPhotos_: function (e) {
        var kittens = e.target.responseXML.querySelectorAll('photo');
        for (var i = 0; i < kittens.length; i++) {
            console.log('adding image!');
            var img = document.createElement('img');
            img.src = this.constructKittenURL_(kittens[i]);
            img.setAttribute('alt', kittens[i].getAttribute('title'));
            document.body.appendChild(img);
        }
    },

    /**
     * Given a photo, construct a URL using the method outlined at
     * http://www.flickr.com/services/api/misc.urlKittenl
     *
     * @param {DOMElement} A kitten.
     * @return {string} The kitten's URL.
     * @private
     */
    constructKittenURL_: function (photo) {
        return "http://farm" + photo.getAttribute("farm") +
            ".static.flickr.com/" + photo.getAttribute("server") +
            "/" + photo.getAttribute("id") +
            "_" + photo.getAttribute("secret") +
            "_s.jpg";
    }
};


// Append a node and inner text to the document body.
function addNodeAndTextToBody(nodeType, nodeText) {
    var node = document.createElement(nodeType);
    var textNode = document.createTextNode(nodeText);
    node.appendChild(textNode);
    document.body.appendChild(node);

    return {node: node, textNode: textNode};
};


$(document).ready(function() {
    function showMostVisitedUrls(searchUrl, startTime, maxUrls, node) {
        chrome.history.search({text: searchUrl, startTime: startTime}, function (results) {
            results.sort(function (a, b) { return a.visitCount - b.visitCount; });
            results.reverse();

            var heading = $('<h2/>', {text: 'Most visits'}).appendTo(node);
            var content = $('<div/>', {id: 'most-visited-content'}).appendTo(node);

            for (var i=0; i<results.length && i<maxUrls; i++) {
                var r = results[i];
                $('<a/>', {href: r.url, text: r.url}).appendTo(content);
                $('<div/>', {text: 'Count: ' + r.visitCount}).appendTo(content);
            }       
        });
    }

    function showMostRecentUrls(searchUrl, maxUrls, node) {
        chrome.history.search({text: searchUrl}, function (results) {
            results.sort(function (a, b) { return a.lastVisitTime - b.lastVisitTime; });
            results.reverse();

            var heading = $('<h2/>', {text: 'Most recent'}).appendTo(node);
            var content = $('<div/>', {id: 'most-recent-content'}).appendTo(node);

            for (var i=0; i<results.length && i<maxUrls; i++) {
                var r = results[i];
                $('<a/>', {href: r.url, text: r.url}).appendTo(content);
                $('<div/>', {text: 'Last visit: ' + moment(r.lastVisitTime).format('llll')}).appendTo(content);
            }       
        });
    };

    $('body').on('click', 'a', function() {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    function createSimpleElement(text, parentNode) {
        var node =  $('<h3/>', {text: text}).appendTo(parentNode);
        for (var i=0; i<5; i++) {
            $('<div/>', {text: 'i = ' + i}).appendTo(node);
        }
    };

    chrome.tabs.query(
        {currentWindow: true, active: true},
        function (tabs) {
            var tab = tabs[0];

            addNodeAndTextToBody('div', tab.url);
            addNodeAndTextToBody('div', tab.title);

            var tabUrl = (new URI(tab.url)).normalize();
            var tabUrlOneLevelUp = tabUrl.clone().segment(-1, '');
            var oneWeekAgo = moment().subtract('weeks', 1).valueOf();
            var maxUrls = 5;

            var mostVisitedDiv = $('<div/>', {id: 'most-visited'}).appendTo('body');
            console.log(mostVisitedDiv);

            var mostRecentDiv = $('<div/>', {id: 'most-recent'}).appendTo('body');
            console.log(mostRecentDiv);

            showMostVisitedUrls(tabUrlOneLevelUp.valueOf(), oneWeekAgo, maxUrls, mostVisitedDiv);
            showMostRecentUrls(tabUrlOneLevelUp.valueOf(), maxUrls, mostRecentDiv);
        });
});
