var tabOpenerInfo = {};
var tabsMarked = [];
var wholePage;
var categories = {};
var tabQueue = [];

var groupBy = 'url';            // Default tree grouping criterion

/*
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(function(command) {
  if (command === "launch-visualization") {
    chrome.tabs.query({title: "Visualize tabs"}, function(tabs) {
      if (tabs.length == 0) {
        chrome.tabs.create({url: "visualization/hypertree.html"});
      }
      else {
        // If a visualization tab is already open, switch to it
        chrome.tabs.update(tabs[0].id, {active: true});
      }
    });
  }
  else if (command === "toggle-mark-tab") {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      var tabId = tabs[0].id;
      if (tabsMarked.indexOf(tabId) >= 0) {
        // tab is marked, unmark it
        unmarkTab(tabId);
      }
      else {
        markTab(tabId);
      }
    });
  }
  else if (command === "switch-mark-tab") {
    //alert('hotkey');
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      var currentTabId = tabs[0].id;
      
      chrome.tabs.getAllInWindow(null, function(tabs) {      
        var index = -1;
        
        for (var i = 0; i < tabs.length; ++i) {
          if (tabs[i].id == currentTabId) {
            index = i;
            break;
          }
        }
        if (index == -1)
          return;
        
        var next = (index + 1) % tabs.length;
        
        // find the next marked tab
        if (tabsMarked.length > 0) {
          while (next != index) {
            if (tabsMarked.indexOf(tabs[next].id) >= 0)
              break;
            next = (next + 1) % tabs.length;
          }
        }
        
        // switch to the next tab
        console.log('switch to ' + next);
        chrome.tabs.update(tabs[next].id, {active: true});
      });
      
    });
  }
});

/**
 * Store ID of a created tab's parent. Strangely, the native
 * tab.openerTabId property is always undefined when accessed by
 * hypertree.js.
 */
chrome.tabs.onCreated.addListener(function(tab) { 
    tabOpenerInfo[tab.id] = tab.openerTabId;
});

/*
 * listener for preview of activated tab  
*/
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.active == true && changeInfo.status == "complete"){
        chrome.tabs.captureVisibleTab(function (imgDataURL) {
            localStorage.setItem(tabId.toString(), imgDataURL);
        });
    }
});


/*
 * remove image data from localStorage when tab is closed 
*/
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    localStorage.removeItem(tabId.toString());
});

/* 
 * clear localStorage when window is closed, however it doesn't work
 */
chrome.windows.onRemoved.addListener(function (windowId) {
    chrome.windows.remove(windowId, function () {
        localStorage.clear();
    });
});


/**
 * Mark a tab.
 * @param {number/String} tabId - Tab ID
 * @param {function} callback - Optional callback
 */
function markTab(tabId, callback) {
  var markScript = "if (document.title.indexOf('★ ') == -1) " +
        "document.title = '★ ' + document.title";
  if (tabsMarked.indexOf(tabId) == -1) {
    tabsMarked.push(tabId);
    chrome.tabs.executeScript(parseInt(tabId), {code: markScript}, callback);
  }
}

/**
 * Unmark a tab.
 * @param {number/String} tabId - Tab ID
 * @param {function} callback - Optional callback
 */
function unmarkTab(tabId, callback) {
  var unmarkScript = "if (document.title.indexOf('★ ') == 0) " +
        "document.title = document.title.substr(2)";
  var index = tabsMarked.indexOf(tabId);
  if (index > -1) {
    tabsMarked.splice(index, 1);
    chrome.tabs.executeScript(parseInt(tabId), {code: unmarkScript}, callback);
  }
}


/**
 * Listen to tab updating
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabsMarked.indexOf(tabId) > -1) {    
    chrome.tabs.executeScript(tabId, {code: "if (document.title.indexOf('★ ') == -1) document.title = '★ ' + document.title;"});
  }
});

/**
 * This function will send request to openDNS to provide updated tab category
 */
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  // Only get category if URL has changed
  if (info.url) {
    getCategory(tabId, tab.url);
  }
});

/**
 * Get category for a URL from OpenDNS, update `categories`.
 * @param {number} tabId - Tab ID
 * @param {String} url - URL to categorize
 * @param {function} callback - function(tabId, category) callback
 */
function getCategory(tabId, url, callback) {
  var U = new URI(url);
  var openDns = new URI("http://domain.opendns.com");
  var serviceURL = openDns.path(U.hostname()).valueOf();
  var req = new XMLHttpRequest();
  req.timeout = 5000;
  req.open("GET", serviceURL);

  req.onload = function() {
    // Process the data received from OpenDNS and update the categories.
    wholePage = req.responseText;
    chrome.browserAction.setBadgeText({text: ''});
    var bg = chrome.extension.getBackgroundPage();
    var EurPlnPath = '//*[@id="maincontent"]/div/div[1]/div[2]/h3/span';
    var bgWholePage = new DOMParser().parseFromString(bg.wholePage, 'text/html');
    var oneTopic = document.evaluate(EurPlnPath, bgWholePage, null, XPathResult.STRING_TYPE, null);
    var tempStr = oneTopic.stringValue.trim();
    if (tempStr) {
      categories[tabId] = tempStr.split(", ");
    }
    else {
      categories[tabId] = null;
    }

    if (callback) {
      callback(tabId, categories[tabId]);
    }
  };
  req.send();
}
