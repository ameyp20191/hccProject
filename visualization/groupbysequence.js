/**
 * @fileOverview Construct tree of tabs grouped by sequence of opening tabs.
 * @name groupbysequence.js
 */


// Recursively attach the current tab and its ancestors to the tree.
function attachTabAndAncestors(tab, tabsById, tree, treeById) {
  var tabOpenerInfo = chrome.extension.getBackgroundPage().tabOpenerInfo;

  var openerTabId = tabOpenerInfo[tab.id];
  var openerTab = tabsById[openerTabId];

  var parentNode = null;      // Parent of the current tab in the tree
  // If opener tab exists, it is the parent
  if (openerTabId != undefined && openerTab != undefined) {
    var openerTabIdString = openerTabId.toString();

    // If opener tab has not been added, add it and its ancestors
    if (!(openerTabIdString in treeById)) {
      parentNode = attachTabAndAncestors(openerTab, tabsById, tree, treeById);
    }
    // Otherwise, get the opener tab node
    else {
      parentNode = treeById[openerTabIdString];
    }
  }
  // No opener tab -- root is the parent
  else {
    parentNode = tree;
  }

  var node = tabToNode(tab);
  node.relation = "Child tab";
  parentNode.children.push(node);
  treeById[node.id] = node;

  return node;
}


function getTabsById(tabs) {
  var tabsById = {};
  for (var i=0; i<tabs.length; i++) {
    tabsById[tabs[i].id] = tabs[i];
  }
  return tabsById;
}


function tabsToTreeBySequence(tabs) {
  var tabsById = getTabsById(tabs);
  var rootNode = {"id": "root-node",
                  "name": "Current window",
                  "data": {url: "", title: "Current window"},
                  "children": []
                 };
  var treeById = {"root-node": rootNode};
  
  for (var i=0; i<tabs.length; i++) {
    if (tabs[i].id in treeById) {
      continue;
    }
    attachTabAndAncestors(tabs[i], tabsById, rootNode, treeById);
  }
  return rootNode;
}
