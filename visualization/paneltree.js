/* Tree which is shown on the panel to the right. */

var panelTreeIdPrefix = 'panel-tree-';


/**
 * Get ID of a node in the panel tree for a given tab ID.
 * @param {String} tabId - Tab ID
 * @returns {String} ID of panel element representing the given tab
 */
function toJstreeId(tabId) {
  // Use a prefix for IDs to avoid conflicts with hypertree nodes
  return panelTreeIdPrefix + tabId;
}


/**
 * Get ID of the tab which is represented by a panel tree node.
 * @param {String} jstreeId - ID of node in the panel tree
 * @returns {String} Tab ID (or ID of node in hypertree if not a tab)
 */
function fromJstreeId(jstreeId) {
  return jstreeId.substring(panelTreeIdPrefix.length);
}


/**
 * Convert a hypertree JSON object to a jsTree-compatible object.
 * @param {Object} obj - JSON object compatible with the hypertree
 */
function toJstreeJson(obj) {
  obj.id = toJstreeId(obj.id);
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
      'search', 'state', 'types', 'wholerow'
    ]
  });
}
