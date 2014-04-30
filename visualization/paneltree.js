/* Tree which is shown on the panel to the right. */

var panelTreeDomId = '#tabs-tree-panel';

var panelTreeIdPrefix = 'panel-tree-';
var panelTreeFakePrefix = panelTreeIdPrefix + 'fake-';
var panelTreeTabPrefix = panelTreeIdPrefix + 'tab-';

/**
 * Get ID of a fake node in the panel tree for a given node ID.
 * @param {String} id - ID of the fake node
 * @returns {String} ID of panel element representing the fake node
 */
function toJstreeFakeId(id) {
  return panelTreeFakePrefix + id;
}

/**
 * Get ID of a node in the panel tree for a given tab ID.
 * @param {String} tabId - Tab ID
 * @returns {String} ID of panel element representing the given tab
 */
function toJstreeTabId(tabId) {
  // Use a prefix for IDs to avoid conflicts with hypertree nodes
  return panelTreeTabPrefix + tabId;
}


/**
 * Get ID of the tab which is represented by a panel tree node.
 * @param {String} jstreeId - ID of node in the panel tree
 * @returns {String} Tab ID (or ID of node in hypertree if not a tab)
 */
function fromJstreeId(jstreeId) {
  var prefix;
  if (jstreeId.indexOf(panelTreeFakePrefix) == 0) {
    prefix = panelTreeFakePrefix;
    // Fake node ID is a String
    return jstreeId.substring(prefix.length);
  }
  else if (jstreeId.indexOf(panelTreeTabPrefix) == 0) {
    prefix = panelTreeTabPrefix;
    // Tab node ID is an integer
    return parseInt(jstreeId.substring(prefix.length));
  }
  else {
    return null;
  }


}

/**
 * Check if the given jstree ID represents a tab.
 */
function isTabId(jstreeId) {
  return jstreeId.indexOf(panelTreeTabPrefix) == 0;
}

/**
 * Check if the given jstree ID represents a fake node.
 */
function isFakeId(jstreeId) {
  return jstreeId.indexOf(panelTreeFakePrefix) == 0;
}


/**
 * Convert a hypertree JSON object to a jsTree-compatible object.
 * @param {Object} obj - JSON object compatible with the hypertree
 */
function toJstreeJson(obj) {
  if (isFakeOrRoot(obj)) {
    obj.id = toJstreeFakeId(obj.id);
  }
  else {
    obj.id = toJstreeTabId(obj.id);
  }

  obj.text = obj.name;
  obj.state = {'opened': true};

  // Aggregate 'data' and 'children' into a single object
  for (var prop in obj.data) {
    obj[prop] = obj.data[prop];
  }
  delete obj.data;

  if ('children' in obj) {
    for (var i=0; i<obj.children.length; i++) {
      toJstreeJson(obj.children[i]);
    }
    if (obj.children.length == 0) {
      delete obj.children;
    }
  }
  obj.icon = obj.favIconUrl;
  delete obj.url;               // Conflicts with jsTree property
}


function refreshTabNodeText(node) {
  var tabId = fromJstreeId(node.id);
  chrome.tabs.get(tabId, function(tab) {
    $(panelTreeDomId).jstree('set_text', node, shortenText(tab.title));
  });
}

function tabNodeContextMenu(node) {
  var tabId = fromJstreeId(node.id);

  var switchAction = { 
    'label': 'Switch to tab',
    'action': function(obj) { 
      switchToTab(tabId, function() { 
        chrome.extension.getBackgroundPage().logSwitchToTabFromPanelTree();
      });
    }
  };

  var markAction = {
    'label': 'Mark tab',
    'action': function(obj) { 
      toggleMarkTab(tabId, function() { 
        refreshTabNodeText(node); 
        chrome.extension.getBackgroundPage().logMarkTabFromPanelTree();
      });
    }
  };
  var showMarkAction = !isMarked(tabId);

  var unmarkAction = {
    'label': 'Unmark tab',
    'action': function(obj) { 
      toggleMarkTab(tabId, function() {
        refreshTabNodeText(node); 
      });
    }
  };
  var showUnmarkAction = isMarked(tabId);

  var items = {};
  items['Switch'] = switchAction;
  if (showMarkAction) {
    items['Mark'] = markAction;
  }
  else if (showUnmarkAction) { 
    items['Unmark'] = unmarkAction;
  }

  return items;
}

function fakeNodeContextMenu(node) {
  var nodeId = fromJstreeId(node.id);

  var focusAction = {
    'label': 'Focus node',
    'action': function(obj) { focusOnNode(nodeId); }
  };

  var items = {};
  items['Focus'] = focusAction;
  return items;
}

/**
 * Show tree in the panel
 * @param {Object} json - JSON object from the hypertree
 */
function showTreeInPanel(json) {
  var elt = $('#tabs-tree-panel');
  elt.jstree('destroy');

  var jsonClone = JSON.parse(JSON.stringify(json));
  toJstreeJson(jsonClone);

  elt.jstree({
    'core': {
      'animation': 100,
      'themes': { 'stripes': false },
      'data': jsonClone
    },
    'plugins': [
      'search', 'state', 'types', 'wholerow', 'contextmenu'
    ],
    'contextmenu': {
      'items': function($node) {
        if (isTabId($node.id)) return tabNodeContextMenu($node);
        else if (isFakeId($node.id)) return fakeNodeContextMenu($node);
        else return {};
      }
    }
  });
}
