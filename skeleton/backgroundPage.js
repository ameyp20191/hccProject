var tabOpenerInfo = {};
var tabsMarked = [];
var wholePage;
var categories={};
var tempId;
var tabQueue = [];

var groupBy = 'url';            // Default tree grouping criterion

chrome.commands.onCommand.addListener(function(command) {
  if (command === "launch-visualization") {
    chrome.tabs.create({url: "visualization/hypertree.html"});
  }
  else if (command === "toggle-mark-tab") {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      var tabId = tabs[0].id;
      if (tabsMarked.indexOf(tabId) >= 0) {
        // tab is marked, unmark it
        chrome.runtime.sendMessage({action: "unmarkTab", tabId: tabId});
      }
      else {
        chrome.runtime.sendMessage({action: "markTab", tabId: tabId});
      }
    });
  }
});

// Store ID of a created tab's parent.
// 
// Strangely, the native tab.openerTabId property is always undefined
// when accessed by hypertree.js.
chrome.tabs.onCreated.addListener(function(tab) { 
    tabOpenerInfo[tab.id] = tab.openerTabId;
});

/*
 * listener for preview of activated tab  
*/
chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log(activeInfo.tabId);
    var tabId = activeInfo.tabId;
    chrome.tabs.captureVisibleTab(function (imgDataURL) {
        localStorage.setItem(tabId.toString(), imgDataURL);
    });
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
 * Listen to message for tab marking
 */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {    
    if (msg.action && msg.action == "markTab" && msg.tabId) {
        console.log(msg.tabId);                
        if (tabsMarked.indexOf(msg.tabId) == -1) {
            tabsMarked.push(msg.tabId);
            chrome.tabs.executeScript(parseInt(msg.tabId), {code: "if (document.title.indexOf('★ ') == -1) document.title = '★ ' + document.title"});
        }
    }
    else if (msg.action && msg.action == "unmarkTab" && msg.tabId) {
        console.log(msg.tabId);        
        var index = tabsMarked.indexOf(msg.tabId);
        if (index > -1) {
            tabsMarked.splice(index, 1);
            chrome.tabs.executeScript(parseInt(msg.tabId), {code: "if (document.title.indexOf('★ ') == 0) document.title = document.title.substr(2)"});
        }
    }
});

/**
 * Listen to tab updating
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabsMarked.indexOf(tabId) > -1) {    
    chrome.tabs.executeScript(tabId, {code: "if (document.title.indexOf('★ ') == -1) document.title = '★ ' + document.title;"});
  }
});

/**
  * This function will process the data received from openDNS and update the categories.
**/

function process()
{
        wholePage = req.responseText;
        chrome.browserAction.setBadgeText({text: ''});
        var bg = chrome.extension.getBackgroundPage();
	var EurPlnPath = '//*[@id="maincontent"]/div/div[1]/div[2]/h3/span';
	var bgWholePage = new DOMParser().parseFromString(bg.wholePage, 'text/html');
        var oneTopic = document.evaluate(EurPlnPath, bgWholePage, null, XPathResult.STRING_TYPE, null);
	var tempStr = oneTopic.stringValue.trim();
	if(tempStr){
		categories[tempId] = tempStr.split(", ");
	}
	else{
		categories[tempId] = null;
	}
}

/**
  * This function will send request to openDNS to provide updated tab category
**/

chrome.tabs.onUpdated.addListener(function getCategory(tabId, info, tab)
{
        if(info.url){
        var U = new URI(tab.url);
        tempId = tabId;
        var serviceURL = "http://domain.opendns.com/" + U.domain();
	req = new XMLHttpRequest();
        req.open("GET", serviceURL);
        req.onload = process;
        req.send();
	}
});
