// Append a node and inner text to the document body.
function addNodeAndTextToBody(nodeType, nodeText) {
    var node = document.createElement(nodeType);
    var textNode = document.createTextNode(nodeText);
    node.appendChild(textNode);
    document.body.appendChild(node);

    return {node: node, textNode: textNode};
};


$(document).ready(function() {
    $('body').on('click', 'a', function() {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    function showMostVisitedUrls(searchUrl, startTime, maxUrls, node) {
        chrome.history.search({text: searchUrl, startTime: startTime}, function (results) {
            results.sort(function (a, b) { return a.visitCount - b.visitCount; });
            results.reverse();

            var heading = $('<h2/>', {text: 'Most visited'}).appendTo(node);
            var content = $('<div/>', {id: 'most-visited-content'}).appendTo(node);

            for (var i=0; i<results.length && i<maxUrls; i++) {
                var r = results[i];
                $('<a/>', {href: r.url, text: r.url}).appendTo(content);
                $('<div/>', {'class': 'url-info',
                             text: 'Count: ' + r.visitCount}).appendTo(content);
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
                $('<div/>', {'class': 'url-info', text: 'Last visit: ' + 
                             moment(r.lastVisitTime).format('llll')}).appendTo(content);
            }       
        });
    };

    chrome.tabs.query(
        {currentWindow: true, active: true},
        function (tabs) {
            var tab = tabs[0];

            var tabTitleDiv = $(
                '<div/>', {'class': 'current-tab-info title', 
                           text: tab.title}).appendTo("body");
            var tabUrlDiv = $(
                '<div/>', {'class': 'current-tab-info url', 
                           text: tab.url}).appendTo("body");

            var tabUrl = (new URI(tab.url)).normalize();
            var tabDomain = tabUrl.domain();
            var tabUrlOneLeavelUp = tabUrl.clone().segment(-1, '');
            var oneWeekAgo = moment().subtract('weeks', 1).valueOf();
            var oneMonthAgo = moment().subtract('months', 1).valueOf();
            var maxUrls = 5;

            var visualizeLinkDiv = $(
                '<a/>', {id: 'visualize-link', 
                         href: 'visualization/hypertree.html',
                         text: 'Visualization'}).appendTo('body');
            
            var mostVisitedDiv = $(
                '<div/>', {'class': 'links-div', id: 'most-visited'}).appendTo('body');
            console.log(mostVisitedDiv);

            var mostRecentDiv = $(
                '<div/>', {'class': 'links-div', id: 'most-recent'}).appendTo('body');
            console.log(mostRecentDiv);

            showMostVisitedUrls(tabDomain.valueOf(), oneMonthAgo, maxUrls, mostVisitedDiv);
            showMostRecentUrls(tabDomain.valueOf(), maxUrls, mostRecentDiv);
        });
});
