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


function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function tabToNode(tab) {
    var node = {"data": {}, "children": []};
    node.id = tab.id.toString();
    node.name = tab.title;
    return node;
}


// Get the complete subtree for a tab and add it to the given tree.
function attachTabAndAncestors(tab, tabsById, tree, treeById) {
    var tabOpenerInfo = chrome.extension.getBackgroundPage().tabOpenerInfo;

    var openerTabId = tabOpenerInfo[tab.id];
    var openerTab = tabsById[openerTabId];

    var parentNode = null;      // Parent of the current tab in the tree
    // If opener tab exists, it is the parent
    if (openerTabId != undefined && openerTab != undefined) {
        var openerTabIdString = openerTabId.toString();

        // If opener tab has not been added, add its subtree
        if (!(openerTabIdString in treeById)) {
            parentNode = tabToSubtree(openerTab, tabsById, tree, treeById);
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


function tabsToTree(tabs) {
    var tabsById = {};
    for (var i=0; i<tabs.length; i++) {
        tabsById[tabs[i].id] = tabs[i];
    }

    var rootNode = {"id": "window-node",
                    "name": "Current window",
                    "data": {},
                    "children": []
                   };
    var treeById = {"window-node": rootNode};
    
    for (i=0; i<tabs.length; i++) {
        if (tabs[i].id in treeById) {
            continue;
        }
        attachTabAndAncestors(tabs[i], tabsById, rootNode, treeById);
    }
    return rootNode;
}


function init(){
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
    var w = infovis.offsetWidth - 50, h = infovis.offsetHeight - 50;

    //init Hypertree
    var ht = new $jit.Hypertree({
        //id of the visualization container
        injectInto: 'infovis',
        //canvas width and height
        width: w,
        height: h,
        //Change node and edge styles such as
        //color, width and dimensions.
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
            $jit.util.addEvent(domElement, 'click', function () {
                
                ht.onClick(node.id, {
                    onComplete: function() {
                        ht.controller.onComplete();
                    }
                });
            });
        },
        //Change node styles when labels are placed
        //or moved.
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
            Log.write("done");
            
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
                    html += "<a href='#' class='tab-link' " + 
                        "tab-id='" + child.id + "'>" + child.name + " " + 
                        "<div class=\"relation\">(relation: " + rel + ")</div></a>";

                }
            });
            html += "</ul>";
            $jit.id('inner-details').innerHTML = html;
        }
    });

    chrome.tabs.query({}, function(tabs) {
        var json = tabsToTree(tabs);
        console.log(json);
        //load JSON data.
        ht.loadJSON(json);
        //compute positions and plot.
        ht.refresh();
        //end
        ht.controller.onComplete();
    });
}

$(document).ready(function() {
    $('body').on('click', 'a.tab-link', function() {
        var tabId = parseInt($(this).attr('tab-id'));
        chrome.tabs.update(tabId, {active: true}, function() {});
        return false;
    });

    $('body').on('click', 'a.node-link', function() {
        var nodeId = $(this).attr('node-id');
        $('#' + nodeId).click();
        return false;
    });

    init();
});
