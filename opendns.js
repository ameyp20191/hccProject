/**
  * Extracts the type category of the tab
  * Use it by calling getCategory with url and tab id as parameters
**/

var SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/"; 
var categories={};
var tempId;

function getCategory(url,id)
{
	var U = new URI(url);
	tempId = id;
	var serviceURL = SEMANTIC_SERVICE_URL + "metadata.jsonp?callback=updateCategories&url=http://domain.opendns.com/" + U.domain();
	var script = document.createElement('script');
	script.src = serviceURL;
	document.head.appendChild(script);
}

function updateCategories(obj)
{
	categories[tempId] = obj.openDNSDomain.description;
}
