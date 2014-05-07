function showMarkAction(node) {
  // mark tabs
  var markLink = $('<button/>', {id: 'mark', text: 'Mark', 'class': 'tab-action-link'}).appendTo(node);
  var unmarkLink = $('<button/>', {id: 'unmark', text: 'Unmark', 'class': 'tab-action-link'}).appendTo(node);
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    var background = chrome.extension.getBackgroundPage();

    markLink.click(function() {
      markCurrentTab();
      unmarkLink.show();
      markLink.hide();
    });

    unmarkLink.click(function() {
      unmarkCurrentTab();
      markLink.show();
      unmarkLink.hide();
    });

    if (background.tabsMarked.indexOf(tabs[0].id) == -1) {
      markLink.show();
      unmarkLink.hide();
    }
    else {
      unmarkLink.show();
      markLink.hide();
    }

  })
}

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
      var text = r.url;
      if (r.title) {
        text = r.title;
      }
      var link = $('<a/>', {href: r.url, text: text}).appendTo(content);

      var urlPopdownDiv = $('<div/>', {'class': 'url-popdown'}).appendTo(content);
      var urlPopdownAnchor = $('<span/>', {text: r.url}).appendTo(urlPopdownDiv);
      urlPopdownDiv.hide();

      link.click(function() { chrome.extension.getBackgroundPage().logOpenFrequentFromPopup(); });
      link.data('urlPopdownDiv', urlPopdownDiv);
      link.hover(function() { $(this).data('urlPopdownDiv').show(); },
                 function() { $(this).data('urlPopdownDiv').hide(); });

      $('<div/>', {'class': 'url-info', text: 'Count: ' + r.visitCount}).appendTo(content);
    }
  });
}


function showUrlBelow() {
  var urlPopdownDiv = $(this).append($('<div/>', {'class': 'url-popdown'})).appendTo($(this));
  $('<a/>', {href: $(this).attr('href'), text: $(this).attr('href')}).appendTo(urlPopdownDiv);
}

function hideUrlBelow() {
  $(this).children('.url-popdown').empty();
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
      var text = r.url;
      if (r.title) {
        text = r.title;
      }
      var link = $('<a/>', {href: r.url, text: text}).appendTo(content);

      var urlPopdownDiv = $('<div/>', {'class': 'url-popdown'}).appendTo(content);
      var urlPopdownAnchor = $('<span/>', {text: r.url}).appendTo(urlPopdownDiv);
      urlPopdownDiv.hide();

      link.click(function() { chrome.extension.getBackgroundPage().logOpenRecentFromPopup(); });
      link.data('urlPopdownDiv', urlPopdownDiv);
      link.hover(function() { $(this).data('urlPopdownDiv').show(); },
                 function() { $(this).data('urlPopdownDiv').hide(); });

      $('<div/>', {'class': 'url-info',
                   text: 'Last visit: ' + moment(r.lastVisitTime).format('llll')}).appendTo(content);
    }
  });
};


/**
 * Show links to the marked tabs.
 * @param {Element} node - DOM element to attach the list to.
 */
function showMarkedTabs(node) {
  var heading = $('<h2/>', {text: 'Marked tabs'}).appendTo(node);
  var content = $('<div/>', {id: 'marked-tabs-content'}).appendTo(node);

  showMarkedTabsContent(content);
}

function showMarkedTabsContent(content) {
  var background = chrome.extension.getBackgroundPage();
  var tabsMarked = background.tabsMarked;

  if (tabsMarked.length == 0) {
    var noTabsMarkedHTML = "Mark a tab by clicking 'Mark' above or using " +
          "Ctrl+Shift+S when this popup is closed. <br/>" +
          "Use Ctrl+Shift+Z to quickly switch between marked tabs.";
    var noTabsMarkedDiv = $('<div/>', {'class': 'no-tabs-marked'}).appendTo(content);
    noTabsMarkedDiv.html(noTabsMarkedHTML);
  }

  for (var i=0; i<tabsMarked.length; i++) {
    var tabId = tabsMarked[i];
    chrome.tabs.get(tabId, function(tab) {
      var tabLinkDiv = $('<div/>', {}).appendTo(content);
      $('<button/>', {'class': 'tab-action-link tab-switch-link',
                      text: tab.title, tabId: tab.id}).appendTo(tabLinkDiv);
    });
  }
}

function updateMarkedTabsLinks(response) {
  console.log('updating marked tabs links!');
  var content = $('#marked-tabs-content');
  content.empty();
  showMarkedTabsContent(content);
}

$(document).ready(function() {
  // Clicking a link opens it in a new tab
  $('body').on('click', 'a', function() {
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
  });

  // Clicking a tab link switches to the tab
  $('body').on('click', 'button.tab-switch-link', function(event) {
    var tabId = parseInt($(this).attr('tabId'));
    chrome.tabs.update(tabId, {active: true}, function() {
      chrome.extension.getBackgroundPage().logSwitchToMarkedTabFromPopup();
    });
  });

  chrome.tabs.query(
    {currentWindow: true, active: true},
    function (tabs) {
      var tab = tabs[0];
      var tabUrl = (new URI(tab.url)).normalize();
      var tabDomain = tabUrl.domain();

      var oneWeekAgo = moment().subtract('weeks', 1).valueOf();
      var oneMonthAgo = moment().subtract('months', 1).valueOf();

      var maxUrls = 5;

      var tabTitleDiv = $('<div/>', {'class': 'current-tab-info title', text: tab.title}).appendTo("body");
      var tabUrlDiv = $('<div/>', {'class': 'current-tab-info url', text: tab.url}).appendTo("body");
      var extensionLinksDiv = $('<div/>', {'id': 'extension-links'}).appendTo('body');
      var markedTabsDiv = $('<div/>', {'class': 'marked-tabs-div', id: 'marked-tabs'}).appendTo('body');
      var mostVisitedDiv = $('<div/>', {'class': 'links-div', id: 'most-visited'}).appendTo('body');
      var mostRecentDiv = $('<div/>', {'class': 'links-div', id: 'most-recent'}).appendTo('body');

      showMarkAction(extensionLinksDiv);
      var visualizeLink = $('<a/>', {id: 'visualize-link',
                                     href: 'visualization/hypertree.html',
                                     text: 'Explore tabs'}).appendTo(extensionLinksDiv);
      visualizeLink.click(function() {
        var background = chrome.extension.getBackgroundPage();
        background.logVisualizationOpenedFromPopup();
      });

      var helpLink = $('<a/>', {id: 'help-link',
                                href: 'help.html', text: 'Help'}).appendTo(extensionLinksDiv);
      helpLink.click(function() {
        var background = chrome.extension.getBackgroundPage();
        background.logHelpOpenedFromPopup();
      });        

      showMarkedTabs(markedTabsDiv);
      showMostVisitedUrls(tabDomain.valueOf(), oneMonthAgo, maxUrls, mostVisitedDiv);
      showMostRecentUrls(tabDomain.valueOf(), maxUrls, mostRecentDiv);
    });
});


function markCurrentTab() {
  var background = chrome.extension.getBackgroundPage();
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    background.markTab(tabs[0].id, function() {
      updateMarkedTabsLinks();
      background.logMarkTabFromPopup();
    });
  });
}

function unmarkCurrentTab() {
  var background = chrome.extension.getBackgroundPage();
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    background.unmarkTab(tabs[0].id, updateMarkedTabsLinks);
  });
}

$(window).focus(function() {
  var background = chrome.extension.getBackgroundPage();
  if (background.doLog) {
    background.logPopupOpened();
  }
});
