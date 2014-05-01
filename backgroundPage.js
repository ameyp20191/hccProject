var tabOpenerInfo = {};
var tabsMarked = [];
var wholePage;
var categories = {};
var tabQueue = [];

var log = {};
var doLog = false;
var logInitialized = false;

var groupBy = 'url';            // Default tree grouping criterion

/*
 * Logging actions
 */
function initLog() {
  log['startTime'] = Date.now();
  log['endTime'] = 0;

  log['tabsOpen'] = {};
  log['tabsCreated'] = {'time': [], 'window': [], 'index': [], 'numOpenTabs': []};
  log['tabsMoved'] = {'time': [], 'window': [], 'numOpenTabs': []};
  log['tabsClosed'] = {'time': [], 'window': [], 'numOpenTabs': []};
  // Time, position and ID of active tab, number of open tabs at each time point
  log['tabsActivated'] = {'time': [], 'id': [], 'window': [], 'index': [], 'numOpenTabs': []};

  log['tabsMarked'] = {'time': [], 'numOpenTabs': [], 'numMarkedTabs': []};

  log['popupOpened'] = {'time': [], 'numOpenTabs': []};
  log['visualizationOpened'] = {'time': [], 'numOpenTabs': []};
  log['visualizationOpenedFromPopup'] = 0;
  log['visualizationOpenedFromHotkey'] = 0;

  log['switchToMarkedTabFromPopup'] = 0;
  log['switchToMarkedTabFromHotkey'] = 0;

  log['openRecentFromPopup'] = 0;
  log['openFrequentFromPopup'] = 0;

  log['switchToTabFromVisualization'] = 0;
  log['switchToTabFromPanelTree'] = 0;

  log['markTabFromHotkey'] = 0;
  log['markTabFromPopup'] = 0;
  log['markTabFromVisualization'] = 0;
  log['markTabFromPanelTree'] = 0;

  log['helpOpenedFromPopup'] = 0;

  log['urlsVisited'] = 0;
  log['urlsRevisited'] = 0;

  log['groupBy'] = {'time': [], 'id': []};

  logInitialized = true;
}

initLog();

/*
 * Track the number of open tabs in the current window over time
 */
function logTabsOpen() {
  if (!doLog) return;

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    var windowId = tabs[0].windowId;
    if (!(windowId in log['tabsOpen'])) {
      log['tabsOpen'][windowId] = {'time': [], 'numOpenTabs': []};
    }

    // Log the timestamp and number of tabs open for each window
    log['tabsOpen'][windowId]['time'].push(Date.now());
    log['tabsOpen'][windowId]['numOpenTabs'].push(tabs.length);
  });
}

function logTabCreated(tab) {
  if (!doLog) return;

  log['tabsCreated']['time'].push(Date.now());
  log['tabsCreated']['index'].push(tab.index);
  log['tabsCreated']['window'].push(tab.windowId);

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    log['tabsCreated']['numOpenTabs'].push(tabs.length);
  });

  logTabsOpen();
}

function logTabClosed(tabId, removeInfo) {
  if (!doLog) return;

  log['tabsClosed']['time'].push(Date.now());
  log['tabsClosed']['window'].push(removeInfo.windowId);

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    log['tabsClosed']['numOpenTabs'].push(tabs.length);
  });

  logTabsOpen();
}

function logTabMoved(tabId, moveInfo) {
  if (!doLog) return;

  log['tabsMoved']['time'].push(Date.now());
  log['tabsMoved']['window'].push(moveInfo.windowId);
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    log['tabsMoved']['numOpenTabs'].push(tabs.length);
  });
}

function logSwitchToMarkedTabFromPopup() {
  if (!doLog) return;

  log['switchToMarkedTabFromPopup']++;
}

function logSwitchToMarkedTabFromHotkey() {
  if (!doLog) return;

  log['switchToMarkedTabFromHotkey']++;
}

function logOpenRecentFromPopup() {
  if (!doLog) return;

  log['openRecentFromPopup']++;
}

function logOpenFrequentFromPopup() {
  if (!doLog) return;

  log['openFrequentFromPopup']++;
}

function logSwitchToTabFromVisualization() {
  if (!doLog) return;

  log['switchToTabFromVisualization']++;
}

function logSwitchToTabFromPanelTree() {
  if (!doLog) return;

  log['switchToTabFromPanelTree']++;
}

function logMarkTabFromPanelTree() {
  if (!doLog) return;
  
  log['markTabFromPanelTree']++;
}

function logMarkTabFromHotkey() {
  if (!doLog) return;
  
  log['markTabFromHotkey']++;
}

function logMarkTabFromPopup() {
  if (!doLog) return;
  
  log['markTabFromPopup']++;
}

function logMarkTabFromVisualization() {
  if (!doLog) return;
  
  log['markTabFromVisualization']++;
}

function logTabsActivated(activeInfo) {
  if (!doLog) return;

  log['tabsActivated']['id'].push(activeInfo.tabId);
  log['tabsActivated']['window'].push(activeInfo.windowId);
  log['tabsActivated']['time'].push(Date.now());
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    log['tabsActivated']['index'].push(tab.index);
  });
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    log['tabsActivated']['numOpenTabs'].push(tabs.length);
  });
}

function logPopupOpened() {
  if (!doLog) return;

  log['popupOpened']['time'].push(Date.now());
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    var numOpenTabs = tabs.length;
    log['popupOpened']['numOpenTabs'].push(numOpenTabs);
  });
}

function logHelpOpenedFromPopup() {
  if (!doLog) return;

  log['helpOpenedFromPopup']++;
}

/* 
 * Log the time and the number of open tabs when the visualization is
 * opened
 */
function logVisualizationOpened() {
  if (!doLog) return;

  log['visualizationOpened']['time'].push(Date.now());
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    var numOpenTabs = tabs.length;
    log['visualizationOpened']['numOpenTabs'].push(numOpenTabs);
  });
}

function logVisualizationOpenedFromPopup() {
  if (!doLog) return; 

  log['visualizationOpenedFromPopup']++;
}

function logVisualizationOpenedFromHotkey() {
  if (!doLog) return; 

  log['visualizationOpenedFromHotkey']++;
}

function logUrlVisited(tabId, changeInfo, tab) {
  if (!doLog) return;
  if (!changeInfo.url) return;

  log['urlsVisited']++;

  // Not very accurate
  chrome.history.getVisits({url: tab.url}, function(visits) {
    if (visits.length > 1) {    // Excluding this visit
      log['urlsRevisited']++;
    }
  });
}

/*
 * Log the time, number of open tabs and number of marked tabs
 */
function logTabsMarked() {
  if (!doLog) return;

  log['tabsMarked']['time'].push(Date.now());
  log['tabsMarked']['numMarkedTabs'].push(tabsMarked.length);
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    var numOpenTabs = tabs.length;
    log['tabsMarked']['numOpenTabs'].push(numOpenTabs);
  });
}

function logGroupBy(groupBy) {
  var id = -1;

  if (groupBy == "url") id = 0;
  else if (groupBy == "category") id = 1;
  else if (groupBy == "sequence") id = 2;

  log['groupBy']['time'].push(Date.now());
  log['groupBy']['id'].push(id);
}

function toggleLogging() {
  if (doLog) {
    stopLogging();
  }
  else {
    startLogging();
  }
}

function startLogging() {
  doLog = true;
  initLog();
  chrome.tabs.onCreated.addListener(logTabCreated);
  chrome.tabs.onRemoved.addListener(logTabClosed);
  chrome.tabs.onMoved.addListener(logTabMoved);
  chrome.tabs.onActivated.addListener(logTabsActivated);
  chrome.tabs.onUpdated.addListener(logUrlVisited);
}

function stopLogging() {
  log['endTime'] = Date.now();
  doLog = false;
  chrome.tabs.onCreated.removeListener(logTabCreated);
  chrome.tabs.onRemoved.removeListener(logTabClosed);
  chrome.tabs.onMoved.removeListener(logTabMoved);
  chrome.tabs.onActivated.removeListener(logTabsActivated);
  chrome.tabs.onUpdated.removeListener(logUrlVisited);
}


/*
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(function(command) {
  if (command === "launch-visualization") {
    chrome.tabs.query({title: "Visualize tabs"}, function(tabs) {
      if (tabs.length == 0) {
        if (doLog)
          logVisualizationOpened();
        chrome.tabs.create({url: "visualization/hypertree.html"}, function() {
          logVisualizationOpenedFromHotkey();
        });
      }
      else {
        // If a visualization tab is already open, switch to it
        chrome.tabs.update(tabs[0].id, {active: true}, function() {
          logVisualizationOpenedFromHotkey();
        });
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
        markTab(tabId, function() {
          logMarkTabFromHotkey();
        });
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
        chrome.tabs.update(tabs[next].id, {active: true}, function() {
          logSwitchToMarkedTabFromHotkey();
        });
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
    
    if (doLog) { 
      logTabsMarked();
    }
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

    if (doLog) {
      logTabsMarked();
    }
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
