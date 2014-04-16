/**
 * @fileOverview Construct tree of tabs grouped by URL.
 * @name groupbyurl.js
 */


/**
 * Normalize the URL for comparison.
 * Strips query parameters.
 * @param {URI} url - URI instance
 */
function normalizeUrl(url) {
  url.normalize();
  url.search("");
}

// Is node A an ancestor of node B?
function isAncestorOf(nodeA, nodeB) {
  var urlA = new URI(nodeA.data.url);
  var urlB = new URI(nodeB.data.url);
  normalizeUrl(urlA);
  normalizeUrl(urlB);

  var domainA = urlA.domain();
  var domainB = urlB.domain();
  // If domains are different, the URLs are not related
  if (domainA != domainB) {
    return false;
  }

  var pathA = urlA.path();
  var pathB = urlB.path();
  // If same paths, they are siblings
  if (pathA === pathB) {
    return false;
  }

  // If path of B contains path of A, assume B is a child of A
  if (pathB.indexOf(pathA) >= 0) {
    return true;
  }
  return false;
}


/**
 * Attach a tab to the tree based on the URL.
 * The tab node can be either:
 * - A direct child of the root node.
 * -- Some existing children may need to be attached to this node.
 * - A descendant of one of the root's children.
 *
 * The tab node is never the parent of the root node.
 * 
 * @param {Tab} tab - tab to be attached
 * @param {Node} rootNode - Root node of the (sub)tree
 */
function attachNode(node, rootNode) {
  // Is this node a direct child of the root?
  var isChildOfRoot = true;
  var children = [];
  for (var i=0; i<rootNode.children.length; i++) {
    var existingNode = rootNode.children[i];

    // If existingNode is an ancestor of node, attach node to
    // existingNode
    if (isAncestorOf(existingNode, node)) {
      isChildOfRoot = false;
      attachNode(node, existingNode);
      break;
    }
    // If node is an ancestor of existingNode, attach existingNode to
    // node. This also means that node is a direct child of rootNode.
    else if (isAncestorOf(node, existingNode)) {
      node.children.push(existingNode);
      children.push(existingNode);
      isChildOfRoot = true;
    }
  }

  // node is to be attached directly to rootNode
  if (isChildOfRoot) {
    // Delete children of rootNode that are to be attached to node.
    // They are now children of node.
    for (var j=0; j<children.length; j++) {
      var index = rootNode.children.indexOf(children[j]);
      rootNode.children.splice(index, 1);
    }
    rootNode.children.push(node);
    return;
  }
}

/**
 * Create a fake node given the URL.
 * It is fake because there is no tab associated with it.
 * @param {String} url - URL in the node.
 * @returns {Node} node - node for this URL.
 */
function createFakeNode(url) {
  var node = {"data": {}, "children": []};
  node.id = url;                // If ID is randomized, the node positions are unpredictable
  var uri = new URI(url);
  node.name = uri.domain();
  node.data.title = uri.domain();
  node.data.url = url;
  node.data.domainNode = true;
  node.data.fake = true;
  return node;
}

/**
 * Construct tree from tabs based on URL.
 * @param {Object} params - {tabs: array of tabs, useFakeNodes: whether to create fake nodes for domains}
 * @returns {Node} rootNode - root node of tree.
 */
function tabsToTreeByUrl(params) {
  var tabs = params.tabs;
  var useFakeNodes = params.useFakeNodes;
  if (useFakeNodes == undefined) {
    useFakeNodes = true;
  }
  var tree = {};
  var fakeDomainsAdded = {};
  var rootNode = {"id": "root-node",
                  "name": "Current window",
                  "data": {url: "/", title: "Current window"},
                  "children": []
                 };
  for (var i=0; i<tabs.length; i++) {
    var tab = tabs[i];
    var tabNode = tabToNode(tab);
    var domain = new URI(tab.url).domain();

    // Insert fake nodes for domain if required
    if (useFakeNodes && !(domain in fakeDomainsAdded)) {
      var domainURI = new URI(domain);
      domainURI.protocol("http");  // Without protocol, no grouping happens. Investigate.

      var domainNode = createFakeNode(domainURI.valueOf());
      attachNode(domainNode, rootNode);
      fakeDomainsAdded[domain] = true;
    }
    attachNode(tabNode, rootNode);
  }
  return rootNode;
}
