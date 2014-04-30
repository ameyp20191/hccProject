var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();


var Log = {
  elem: false,
  write: function(text){
    if (!this.elem)
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};


/**
 * Load favicons for each tab.
 *
 * Creates an image element for each node, loads the favicon, and once
 * loaded, replots the node to make the icon visible.
 *
 * See question 7287285 on Stack Overflow.
 */
function loadFavIcons() {
  ht.graph.eachNode(function(node) {
    if (node.getData('type') === 'image') {
      var img = new Image();
      img.addEventListener('load', function() {
        node.setData('image', img);
        ht.fx.plotNode(node, ht.canvas);
      }, false);
      img.src = node.data.favIconUrl;
    }
  });
}

function isFakeOrRoot(node) {
  return node.data.fake || node.id == "root-node";
}

function init(groupBy){
  $jit.Hypertree.Plot.NodeTypes.implement({
    'image': {
      'render': function(node, canvas) {
        var ctx = canvas.getCtx();
        var pos = node.getPos().getc();
        var scale = node.scale;

        if (node.getData('image')) {
          var img = node.getData('image');

          var width = node.getData('dim');
          var height = node.getData('dim');
          node.data.imgWidth = width;
          node.data.imgHeight = height;

          // x and y so that the image is centered
          var xPos = pos.x * scale - (width / 2);
          var yPos = pos.y * scale - (height / 2);

          ctx.drawImage(img, xPos, yPos, width, height);
        }
      },

      'contains': function(node, pos) {
        var npos = node.pos.getc().$scale(node.scale);

        var width = node.data.imgWidth;
        var height = node.data.imgHeight;

        return this.nodeHelper.square.contains(npos, pos, width, height);
      }
    }
  });

  var infovis = document.getElementById('infovis');
  infovis.innerHTML = '';
  var w = infovis.offsetWidth - 50, h = infovis.offsetHeight - 50;
  ht = new $jit.Hypertree({
    duration: 1000,
    Navigation: {
      enable: true,
      panning: false,
      zooming: false
    },

    Events: {
      enable: true,

      // Switch to tab on left click
      onClick: function(node, eventInfo, e) {
        if (eventInfo.node) {
          console.log('node name = ', eventInfo.node.name);

          if (isFakeOrRoot(eventInfo.node)) {
            focusOnNode(eventInfo.node.id);
          }
          else {
            switchToTab(eventInfo.node.id, function() {
              chrome.extension.getBackgroundPage().logSwitchToTabFromVisualization();
            });
          }
        }
      },

      // Mark or unmark tab on right click, doesn't work as
      // eventInfo.pos is false
      onRightClick: function(node, eventInfo, e) {
        if (eventInfo.node) {
          if (!isFakeOrRoot(eventInfo.node)) {
            toggleMarkTab(eventInfo.node.id);
          }
        }
      }
    },

    // Animation is buggy. Changing the node style on hover frequently
    // messes up subsequent centerings. If a node is centered, it ends
    // up not being at the centre. Centering the same node multiple
    // times causes its position to change. The correct behaviour is
    // for the node position to remain the same on multiple centerings
    // (i.e., at the centre of the canvas).
    NodeStyles: {
      enable: true,
      type: 'Native'
      // stylesHover: {
      //    dim: 30,
      //    color: '#fcc'
      //  },
      // duration: 600
    },

    Tips: {
      enable: true,
      type: 'Native',
      offsetX: 10,
      offsetY: 10,
      onShow: function(tip, node) {
        tip.innerHTML = '';
        if (node.data.domainNode) {
          tip.innerHTML = '<b>' + node.data.title + '</b> <br/>';
          tip.innerHTML += 'Domain: ' + node.data.title + '<br/>';
        }
        else if (node.data.categoryNode) {
          tip.innerHTML = 'Category: <b>' + node.data.title + '</b> <br/>';
        }
        else {
          tip.innerHTML = '<b>' + node.data.title + '</b> <br/>' + node.data.url + '<br/>';
        }
        var img = getTabImage(node.id); // add preview under the url
        if( img != null ) {
          tip.className = 'tip with-preview';
          tip.appendChild(img);
        }
        else {
          tip.className = 'tip';
        }

        if (!isFakeOrRoot(node)) {
          tip.innerHTML += '<br/><em>Click to switch</em>';
        }
        else {
          tip.innerHTML += '<br/><em>Click to focus</em>';
        }
      }
    },

    // ID of the visualization container
    injectInto: 'infovis',

    // Canvas width and height
    width: w,
    height: h,

    // Change node and edge styles such as color, width and dimensions.
    Node: {
      overridable: true,
      dim: 9,
      color: "#f00"
    },

    Edge: {
      lineWidth: 2,
      //color: "#088"
      //color: "rgb(157, 209, 50)"
      color: "rgb(177, 220, 90)"
    },

    onBeforeCompute: function(node) { 
      Log.write("Centering...");
    },

    onBeforePlotNode: function(node) {
      if (node.data.fake) {
        node.data.$color = "#922";
      }
    },

    // Attach event handlers and add text to the labels. This method is
    // only triggered on label creation
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      domElement.setAttribute("tab-id", node.id);
      if (node.data.fake) {
        $(domElement).addClass('fake');
        domElement.setAttribute("fake", "true");
      }
      
      $jit.util.addEvent(domElement, 'click', function () {
        if (node.id && isFakeOrRoot(node)) {
          focusOnNode(node.id);
        }
      });
    },

    // Change node styles when labels are placed or moved.
    onPlaceLabel: function(domElement, node){
      $(domElement).attr('depth', node._depth);

      var style = domElement.style;
      var left = parseInt(style.left);
      var top = parseInt(style.top);
      var w = domElement.offsetWidth;
      style.left = (left - w / 2) + 'px';
      style.top = (top + 10) + 'px';
    },

    onComplete: function(){
      Log.write("");
      addClickToAnnotationPanel();
      addClickToAnnotation();
      //addClickToSwitch();
    }
  });

  displayTree(groupBy);
}


/*
* Get the preview of required Tab from localStorage
* @param {tabID} id of required tab
* @returns {img} html element for the preview of required tab
*/
function getTabImage(tabID) {
    var retrievedData = localStorage.getItem(tabID);
    var img = document.createElement('img');
    if (retrievedData === "undefined" || retrievedData === null)
        return null;
    img.src = retrievedData;
    img.style.maxWidth = '280px';
    img.border = '2px';

    return img;
}

/**
 * Add markings to annotate tabs
 */
function addClickToAnnotationPanel() {  
  
  $('a.tab-link').each(function() {

    var mark = $('<a/>', {'class': 'mark mark-toggle',
                          text: '★ '});
    var unmark = $('<a/>', {'class': 'unmark mark-toggle',
                            text: '★ '});         
    var tabID = parseInt($(this).attr('tab-id'));

    mark.click(function() {
      mark.hide();
      unmark.show();        
      chrome.extension.getBackgroundPage().unmarkTab(tabID);

      // click on the tree
      $('div.node').each(function() {
        if ($(this).attr('tab-id') != tabID)
          return;        
        $(this).children('.mark').hide();  
        $(this).children('.unmark').show();
      });
      
      return false;           // Prevents node from centering
    });
    
    unmark.click(function() {
      event.preventDefault();
      unmark.hide();
      mark.show();        
      chrome.extension.getBackgroundPage().markTab(tabID);
      
      // click on the tree
      $('div.node').each(function() {
        if ($(this).attr('tab-id') != tabID)
          return;
        $(this).children('.unmark').hide();  
        $(this).children('.mark').show();        
      });
      
      return false;           // Prevents node from centering
    });
      
    if ($(this).text().indexOf('★ ') == 0) {      
      $(this).html($(this).text().substr(2));
      $(this).prepend(mark);
      $(this).prepend(unmark);        
      unmark.hide();
    }
    else {
      $(this).prepend(mark);
      $(this).prepend(unmark);
      mark.hide();
    }
  });
}


function displayTree(groupBy) {
  chrome.tabs.query({}, function(tabs) {
    var json;
    if (groupBy !== "category") {
      $('div.get-missing-categories').hide();
    }

    if (groupBy === "sequence") {
      json = tabsToTreeBySequence(tabs);
    }
    else if (groupBy === "url") {
      json = tabsToTreeByUrl({tabs: tabs, useFakeNodes: true});
    }
    else if (groupBy === "category") {
      setMissingCategoriesDivState();
      json = tabsToTreeByCategory(tabs);
    }
    else {
      json = tabsToTreeBySequence(tabs);
    }

    // Load JSON data.
    ht.loadJSON(json);
    // Load favicons.
    loadFavIcons();
    // Compute positions and plot.
    ht.refresh();
    // End
    ht.controller.onComplete();

    showTreeInPanel(json);
  });
}


/* Show the missing categories button if and only if there are tabs
 * for which categories have not been fetched.
 *
 * Note that this only refers to the lack of 'fetching', and does not
 * include tabs for which fetching was attempted but did not produce
 * any useful results.
 */
function setMissingCategoriesDivState() {
  var shown = false;
  var categories = chrome.extension.getBackgroundPage().categories;
  chrome.tabs.query({}, function(tabs) {
    for (var i=0; i<tabs.length; i++) {
      var tabId = tabs[i].id;
      if (!(tabId in categories)) {
        shown = true;
        break;
      }
    }
    var missingCategoriesDiv = $('div.get-missing-categories');
    if (shown) {
      missingCategoriesDiv.show();
    }
    else {
      missingCategoriesDiv.hide();
    }
  });
}


/**
 * Get categories for the necessary tabs and redraw the tree.
 */
function getCategoriesAndUpdateTree() {
  chrome.tabs.query({}, function(tabs) {
    getRemainingCategories(tabs, function(tabId, category) {
      var newJson = tabsToTreeByCategory(tabs);
      ht.op.morph(newJson, {
        type: 'replot',
        duration: 200,
        hideLabels: false,
        transition: $jit.Trans.Quart.easeOut
      });
      showTreeInPanel(newJson);
      setMissingCategoriesDivState();
    });
  });
}


/**
 * Add markings to annotate tabs
 */
function addClickToAnnotation() {  
  
  $('div.node').each(function() {
    // No annotation for fake nodes
    if ($(this).attr('fake') == 'true' || $(this).attr('id') == 'root-node') {
      return;
    }

    if ($(this).has('a.mark-toggle').length == 0) {

      var mark = $('<a/>', {'class': 'mark mark-toggle',
                            text: '★ '});
      var unmark = $('<a/>', {'class': 'unmark mark-toggle',
                              text: '★ '});         
      var tabID = parseInt($(this).attr('id'));

      mark.click(function() {
        mark.hide();
        unmark.show();        
        // Unmark tab
        toggleMarkTab(tabID);
        
        // click on the right panel
        $('li .tab-link').each(function() {
          if ($(this).attr('tab-id') != tabID)
            return;
          //alert('unmark: ' + $(this).text());
          //$(this).children('.mark').trigger('click');
          $(this).children('.mark').hide();
          $(this).children('.unmark').show();  
        });
        
        return false;           // Prevents node from centering
      });
      
      unmark.click(function() {
        event.preventDefault();
        unmark.hide();
        mark.show();        
        // Mark tab
        toggleMarkTab(tabID, function() {
          chrome.extension.getBackgroundPage().logMarkTabFromVisualization();
        });
        
        // click on the right panel
        $('li .tab-link').each(function() {
          if ($(this).attr('tab-id') != tabID)
            return;
          //alert('mark: ' + $(this).text());
          //$(this).children('.unmark').trigger('click');
          $(this).children('.unmark').hide();
          $(this).children('.mark').show();          
        });
        
        return false;           // Prevents node from centering
      });
        
      if ($(this).text().indexOf('★ ') == 0) {      
        $(this).html($(this).text().substr(2));
        $(this).prepend(mark);
        $(this).prepend(unmark);        
        unmark.hide();
      }
      else {
        $(this).prepend(mark);
        $(this).prepend(unmark);
        mark.hide();
      }
    }
  });
}

/**
 * Get the tab ID for the given tree node DOM element.
 * @param {Element} treeElem - DOM element of the node.
 * @returns {number} ID of the tab which the node represents.
 */
function getTabId(treeElem) {
  return parseInt($(treeElem).attr('tab-id'));
}


function setupTree(groupBy) {
  init(groupBy);
}

function setGroupBy(groupBy) {
  chrome.extension.getBackgroundPage().groupBy = groupBy;
}

function getGroupBy() {
  return chrome.extension.getBackgroundPage().groupBy;
}

$(document).ready(function() {
  $('body').on('click', 'a.tab-link', function() {
    var tabId = getTabId(this);
    switchToTab(tabId, function() {
      chrome.extension.getBackgroundPage().logSwitchToTabFromVisualization();
    });
    return false;
  });

  $('body').on('click', 'a.node-link', function() {
    var nodeId = $(this).attr('node-id');
    $(document.getElementById(nodeId)).click();
    return false;
  });

  $('body').on('change', 'input[type=radio]', function() {
    var groupBy = $(this).val();
    setupTree(groupBy);
    setGroupBy(groupBy);
    return false;
  });

  $('body').on('click', 'div.get-missing-categories input', function() {
    getCategoriesAndUpdateTree();
  });

  $('input[name=group-by][type=radio]').val([getGroupBy()]);

  setupTree(getGroupBy());
});

$(window).focus(function() {
  var background = chrome.extension.getBackgroundPage();
  if (background.doLog) {
    background.logVisualizationOpened();
  }
});
