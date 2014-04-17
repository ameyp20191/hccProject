function attachNodeByCategory(node, rootNode, categoryNodesByCategory) {
  var isCategoryNode = node.data.categoryNode;
  if (isCategoryNode) {
    rootNode.children.push(node);
    return;
  }

  var category = node.data.category;
  var categoryNode = categoryNodesByCategory[category];
  categoryNode.children.push(node);
}

function createCategoryNode(category) {
  var node = {"data": {}, "children": []};
  node.id = category;
  node.name = category;
  node.data.title = category;
  node.data.categoryNode = true;
  node.data.fake = true;
  return node;
}

// Get categories for tabs for which no fetching has been attempted
function getRemainingCategories(tabs, callback) {
  var background = chrome.extension.getBackgroundPage();
  var categories = background.categories;
  for (var i=0; i<tabs.length; i++) {
    var tabId = tabs[i].id;
    var url = tabs[i].url;
    if (!(tabId in categories)) {
      background.getCategory(tabId, url, callback);
    }
  }
}

function tabsToTreeByCategory(tabs) {
  var tree = {};
  var categoriesAdded = {};
  var defaultCategory = ["Uncategorized"];
  var background = chrome.extension.getBackgroundPage();
  var categories = background.categories;
  var categoryNodesByCategory = {};
  
  var rootNode = {"id": "root-node",
                  "name": "Current window",
                  "data": {url: "/", title: "Current window"},
                  "children": []
                 };

  for (var i=0; i<tabs.length; i++) {
    var tab = tabs[i];
    var tabId = tab.id;
    var tabNode = tabToNode(tab);
    var category = categories[tabId];
    if (!category) {
      category = defaultCategory;
    }

    // Use only first category for now
    category = category[0];

    if (!(category in categoriesAdded)) {
      var categoryNode = createCategoryNode(category);
      attachNodeByCategory(categoryNode, rootNode);
      categoryNodesByCategory[category] = categoryNode;
      categoriesAdded[category] = true;
    }
    
    tabNode.data.category = category;
    attachNodeByCategory(tabNode, rootNode, categoryNodesByCategory);
  }
  return rootNode;
}
