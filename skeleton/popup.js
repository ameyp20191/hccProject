/**
 * Show a list of the most visited URLs containing a given search term.
 * @param {string} searchText - Text which URLs must contain.
 * @param {number} startTime - Timestamp from where to start the search.
 * @param {number} maxUrls - Max URLs to show.
 * @param {Element} node - DOM element to attach the list to.
 */
function showMostVisitedUrls(searchText, startTime, maxUrls, node) {
  chrome.history.search({text: searchText, startTime: startTime}, function (results) {
    results.sort(function (a, b) { return a.visitCount - b.visitCount; });
    results.reverse();

    var heading = $('<h2/>', {text: 'Most visited'}).appendTo(node);
    var content = $('<div/>', {id: 'most-visited-content'}).appendTo(node);

    for (var i=0; i<results.length && i<maxUrls; i++) {
      var r = results[i];
      $('<a/>', {href: r.url, text: r.url}).appendTo(content);
      $('<div/>', {'class': 'url-info', text: 'Count: ' + r.visitCount}).appendTo(content);
    }       
  });
}


/**
 * Show a list of the most recently visited URLs containing a search term.
 * @param {string} searchText - Text which URLs must contain.
 * @param {number} maxUrls - Max URLs to show.
 * @param {Element} node - DOM element to attach the list to.
 */
function showMostRecentUrls(searchText, maxUrls, node) {
  chrome.history.search({text: searchText}, function (results) {
    results.sort(function (a, b) { return a.lastVisitTime - b.lastVisitTime; });
    results.reverse();

    var heading = $('<h2/>', {text: 'Most recent'}).appendTo(node);
    var content = $('<div/>', {id: 'most-recent-content'}).appendTo(node);

    for (var i=0; i<results.length && i<maxUrls; i++) {
      var r = results[i];
      $('<a/>', {href: r.url, text: r.url}).appendTo(content);
      $('<div/>', {'class': 'url-info', 
                   text: 'Last visit: ' + moment(r.lastVisitTime).format('llll')}).appendTo(content);
    }       
  });
};


$(document).ready(function() {
  // Clicking a link opens it in a new tab
  $('body').on('click', 'a', function() {
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
  });

  chrome.tabs.query(
    {currentWindow: true, active: true},
    function (tabs) {
      var tab = tabs[0];
      var tabUrl = (new URI(tab.url)).normalize();
      var tabDomain = tabUrl.domain();
      var tabUrlOneLevelUp = tabUrl.clone().segment(-1, '');

      var oneWeekAgo = moment().subtract('weeks', 1).valueOf();
      var oneMonthAgo = moment().subtract('months', 1).valueOf();

      var maxUrls = 5;

      var tabTitleDiv = $('<div/>', {'class': 'current-tab-info title', 
                                     text: tab.title}).appendTo("body");
      var tabUrlDiv = $('<div/>', {'class': 'current-tab-info url', 
                                   text: tab.url}).appendTo("body");
      var visualizeLinkDiv = $('<a/>', {id: 'visualize-link', 
                                        href: 'visualization/hypertree.html',
                                        text: 'Visualization'}).appendTo('body');

      var mostVisitedDiv = $('<div/>', {'class': 'links-div', 
                                        id: 'most-visited'}).appendTo('body');
      var mostRecentDiv = $('<div/>', {'class': 'links-div', 
                                       id: 'most-recent'}).appendTo('body');

      showMostVisitedUrls(tabDomain.valueOf(), oneMonthAgo, maxUrls, mostVisitedDiv);
      showMostRecentUrls(tabDomain.valueOf(), maxUrls, mostRecentDiv);
    });
});
