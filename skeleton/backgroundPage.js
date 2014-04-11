var tabOpenerInfo = {};

// Store ID of a created tab's parent.
// 
// Strangely, the native tab.openerTabId property is always undefined
// when accessed by hypertree.js.
chrome.tabs.onCreated.addListener(function(tab) { 
    tabOpenerInfo[tab.id] = tab.openerTabId;
});
