var tabOpenerInfo = {};
var tabsMarked = [];

// Store ID of a created tab's parent.
// 
// Strangely, the native tab.openerTabId property is always undefined
// when accessed by hypertree.js.
chrome.tabs.onCreated.addListener(function(tab) { 
    tabOpenerInfo[tab.id] = tab.openerTabId;
});

/**
 * Listen to message for tab marking
 */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {    
    if (msg.action && msg.action == "markTab" && msg.tabId) {
        console.log(msg.tabId);
        if (tabsMarked.indexOf(msg.tabId) == -1) {
            tabsMarked.push(msg.tabId);
            chrome.tabs.executeScript(msg.tabId, {code: "if (document.title.indexOf('★ ') == -1) document.title = '★ ' + document.title"});
        }
    }
    else if (msg.action && msg.action == "unmarkTab" && msg.tabId) {
        console.log(msg.tabId);
        var index = tabsMarked.indexOf(msg.tabId);
        if (index > -1) {
            tabsMarked.splice(index, 1);
            chrome.tabs.executeScript(msg.tabId, {code: "if (document.title.indexOf('★ ') > -1) document.title = document.title.substr(2)"});
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