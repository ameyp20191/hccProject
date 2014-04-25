/**
 * Return text shortened to 21 characters.
 * @param {String} text - Text to be shortened
 * @returns {String} Shortened text
 */
function shortenText(text) {
  if (text.length > 21) {
    return text.substring(0, 18) + '..';
  }
  else {
    return text;
  }
}


/**
 * Convert a Tab object to a tree Node.
 * @param {Tab} tab - Tab object
 * @returns {Node} Node for use with hypertree
 */
function tabToNode(tab) {
  var node = {"data": {}, "children": []};
  node.id = tab.id.toString();
  node.name = shortenText(tab.title);
  node.data.title = tab.title;
  node.data.url = tab.url;
  // Check if favicon can be displayed
  var uri = new URI(tab.url);
  // Local resources cannot be accessed if permissions have not been granted
  if (uri.protocol() !== "chrome" && uri.protocol() !== "file") {
    if (tab.favIconUrl) {
      node.data.favIconUrl = tab.favIconUrl;
    }
    else {
      node.data.favIconUrl = "default_favicon.png";
    }
  }
  else {
    node.data.favIconUrl = "default_favicon.png";
  }
  node.data["$type"] = "image";
  node.data["$dim"] = 20;
  return node;
}


/**
 * Get the preview of required Tab from localStorage
 * @param {tabID} id of required tab
 * @returns {img} html element for the preview of required tab
 */
function getTabImage(tabID) {
    var retrievedData = localStorage.getItem(tabID);
    var img = document.createElement('img');
    if (retrievedData === undefined || retrievedData === null)
        return null;
    img.className = 'preview';
    img.src = retrievedData;
    return img;
}
