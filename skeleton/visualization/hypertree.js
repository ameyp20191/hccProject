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


function tabToNode(tab) {
  var node = {"data": {}, "children": []};
  node.id = tab.id.toString();
  if (tab.title.length > 21) {
    node.name = tab.title.substring(0, 18) + '..';
  }
  else {
    node.name = tab.title;
  }

  node.data.title = tab.title;
  node.data.url = tab.url;
  return node;
}



function init(groupBy){
  $jit.Hypertree.Plot.NodeTypes.implement({
    'image': {
      'render': function(node, canvas) {
        var ctx = canvas.getCtx();
        var img = document.getElementById("my-icon");
        var pos = node.getPos().getc();
        var scale = node.scale;
        ctx.drawImage(img, pos.x * scale, pos.y * scale, 20, 20);
      }
    }
  });
  
  var infovis = document.getElementById('infovis');
  infovis.innerHTML = '';
  var w = infovis.offsetWidth - 50, h = infovis.offsetHeight - 50;
  //var w = 1280, h = 1024;
  //init Hypertree
  var ht = new $jit.Hypertree({
    duration: 1000,
    Navigation: {
      enable: true,
      panning: true,
      zooming: true
    },
    Tips: {
      enable: true,
      type: 'Native',
      offsetX: 10,
      offsetY: 10,
      onShow: function(tip, node) {
        console.log(tip);
        tip.innerHTML = '<b>' + node.data.title + '</b> <br/>' + node.data.url;
      }
    },
    //id of the visualization container
    injectInto: 'infovis',
    //canvas width and height
    width: w,
    height: h,
    //Change node and edge styles such as color, width and dimensions.
    Node: {
      overridable: true,
      dim: 9,
      color: "#f00"
    },
    Edge: {
      lineWidth: 2,
      color: "#088"
    },
    onBeforeCompute: function(node){
      Log.write("centering");
    },
    //Attach event handlers and add text to the
    //labels. This method is only triggered on label
    //creation
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      domElement.setAttribute("tab-id", node.id);
      $jit.util.addEvent(domElement, 'click', function () {
        ht.onClick(node.id, {
          onComplete: function() {
            ht.controller.onComplete();
          }
        });
      });
    },
    //Change node styles when labels are placed or moved.
    onPlaceLabel: function(domElement, node){
      var style = domElement.style;
      style.display = '';
      style.cursor = 'pointer';
      if (node._depth <= 1) {
        style.fontSize = "0.8em";
        style.color = "#ddd";

      } else if(node._depth == 2){
        style.fontSize = "0.7em";
        style.color = "#555";

      } else {
        style.display = 'none';
      }

      var left = parseInt(style.left);
      var w = domElement.offsetWidth;
      style.left = (left - w / 2) + 'px';
    },
    
    onComplete: function(){
      //Log.write("done");
      Log.write(" ");

      //Build the right column relations list.
      //This is done by collecting the information (stored in the data property) 
      //for all the nodes adjacent to the centered node.
      var node = ht.graph.getClosestNodeToOrigin("current");
      var html = "<h4>" + node.name + "</h4><b>Connections:</b>";
      html += "<ul>";
      node.eachAdjacency(function(adj){
        var child = adj.nodeTo;
        if (child.data) {
          var rel = (child.data.band == node.name) ? child.data.relation : node.data.relation;
          // html += "<a href='#' class='tab-link' " + 
          //     "tab-id='" + child.id + "'>" + child.name + " " + 
          //     "<div class=\"relation\">(relation: " + rel + ")</div></a>";
          html += "<div><a href='#' class='tab-link' " + 
            "tab-id='" + child.id + "'>" + child.data.title + "</a></div>";

        }
      });
      html += "</ul>";
      $jit.id('inner-details').innerHTML = html;
    }
  });

  function displayTree(groupBy) {
    chrome.tabs.query({}, function(tabs) {
      console.log('groupBy = ');
      console.log(groupBy);
      var json;
      if (groupBy === "sequence") {
        json = tabsToTreeBySequence(tabs);
      }
      else if (groupBy === "url") {
        json = tabsToTreeByUrl(tabs);
      }
      else { 
        json = tabsToTreeBySequence(tabs);
      }
      
      console.log(json);
      //load JSON data.
      ht.loadJSON(json);
      //compute positions and plot.
      ht.refresh();
      //end
      ht.controller.onComplete();
    });
  }

  displayTree(groupBy);
}


/**
 * Get the tab ID for the given tree node DOM element.
 * @param {Element} treeElem - DOM element of the node.
 * @returns {number} ID of the tab which the node represents.
 */
function getTabId(treeElem) {
  return parseInt($(treeElem).attr('tab-id'));
}


/**
 * Add event listeners to show a tab briefly on hovering over its node.
 */
function addHoverToPreviewActions() {
  /**
   * Switches to a tab for a given time and switches back.
   * @param {number} tabId - ID of the tab to preview.
   * @param {number} orgTabId - ID of the original tab.
   * @param {number} previewTime - Time to show the tab for.
   */
  function previewTab(tabId, orgTabId, previewTime) {
    chrome.tabs.update(tabId, {active: true}, function(tab) {
      setTimeout(function() {
        chrome.tabs.update(orgTabId, {active: true}, function() {});
      }, previewTime);
    });
  }

  var hoverTimeout;
  $('body').on('mouseenter', 'div.node', function() {
    var tabId = getTabId(this);
    var previewWaitTime = 1000;
    var previewDuration = 500;
    chrome.tabs.getCurrent(function(tab) {
      var myTabId = tab.id;
      hoverTimeout = setTimeout(function() {
        previewTab(tabId, myTabId, previewDuration);
      }, previewWaitTime);
    });
  });

  $('body').on('mouseleave', 'div.node', function() {
    clearTimeout(hoverTimeout);
  });
}

function setupTree(groupBy) {
  init(groupBy);
}

var groupBy = 'sequence';

$(document).ready(function() {
  $('body').on('click', 'a.tab-link', function() {
    var tabId = getTabId(this);
    chrome.tabs.update(tabId, {active: true}, function() {});
    return false;
  });

  $('body').on('click', 'a.node-link', function() {
    var nodeId = $(this).attr('node-id');
    $('#' + nodeId).click();
    return false;
  });

  $('body').on('change', 'input[type=radio]', function() {
    console.log('radio selected');
    groupBy = $(this).val();
    setupTree(groupBy);
    return false;
  });

  addHoverToPreviewActions();
  setupTree(groupBy);
});
