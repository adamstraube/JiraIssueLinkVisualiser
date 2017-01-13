// Link Visualiser
// By Adam Straube

groupSize = 78;
idealLength = 135;

boundingBoxOneArray = ['Resolved', 'Closed'];
boundingBoxOneColor = 'green';
boundingBoxTwoArray = ['In Progress'];
boundingBoxTwoColor = 'orange';

var nodeId = 0;
var layout = 0;


function fullScreen() {
	if ( $("div#linkVisualiser").hasClass( "modal" ) )
	{
		$("div#linkVisualiser").removeClass("modal");
		$("div#linkGraph").removeClass("modal-content");
		$("div#linkGraph > svg").attr("height", "");
		//$("div#linkVisualiser").off("click");
	}
	else
	{
		//$("div#linkVisualiser").click(function () {fullScreen()});
		$("div#linkVisualiser").addClass("modal");
		$("div#linkGraph").addClass("modal-content");	
		$("div#linkGraph > svg").attr("height", window.innerHeight *.8);
		
	}
}

// Iterates through 
function disectLinksFromJSON($response) {
	$result = 0;
	$issue_array_blocks = [];
	$issue_array_is_blocked = [];
	$issue_array_subtasks = [];
	
	// Disect  inward and outward issue links into different arrays
	$.each($response["fields"]["issuelinks"], function (index, value) {
		if (typeof value["outwardIssue"] != 'undefined')
		{
			$issue_array_blocks.push( value["outwardIssue"]);
		}
		if (typeof value["inwardIssue"] != 'undefined')
		{
			$issue_array_is_blocked.push( value["inwardIssue"]);
		}

		$result = $result + 1;
	});

	// Disect issue subtasks into an array
	$.each($response["fields"]["subtasks"], function (index, value) {
		$issue_array_subtasks.push( value );

		$result = $result + 1;
	});
	

	return [$issue_array_blocks, $issue_array_is_blocked, $issue_array_subtasks, $result];
	
}

// Adjust the view so that the node id passed in is centered on screen
function adjustView(issueNodeId, layout) {
	var graphRect = layout.getGraphRect();
	var graphSize = Math.min(graphRect.x2 - graphRect.x1, graphRect.y2 - graphRect.y1) ;
	var screenSize = Math.min(document.getElementById('linkGraph').clientWidth, document.getElementById('linkGraph').clientHeight);
	var desiredScale = screenSize / graphSize * .8;
	zoomOut(desiredScale, 1);
	panToIssue(issueNodeId);

	
	function panToIssue(issueNodeId) {
		var pos = layout.getNodePosition(issueNodeId);
		renderer.moveTo(pos.x, pos.y*1.5);
	};
	
	function zoomOut(desiredScale, currentScale) {
		if (desiredScale < currentScale) {
		  currentScale = renderer.zoomOut();
		  setTimeout(function () {
			  zoomOut(desiredScale, currentScale);
		  }, 16);
		}
	}
	

}

// Create the graph from array passed in
function generateView(issueLinkResults) {
	$targetId = '#viewissuesidebar';
	$templateId = '#datesmodule';
	
	$templateCode = $($templateId).clone().attr("id", "linkmodule");
	
	$("h2", $templateCode).text("Link Visualiser");
	$("div", $templateCode).prop('id', 'linkVisualiser');
	$templateCode.find("li").remove();
	/*chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
		console.log($("div.linkVisualiser", $templateCode));
	});*/
	
	$("div#linkVisualiser.mod-content", $templateCode).append( '<div id="linkGraph"><div id="issueLinkToolbox" class="tool-box" width: 20%"><form class="search-box no-print"><a href="#" class="issueLink-fullscreen" title="Fullscreen"><i class="material-icons">fullscreen</i></a></form></div></div>' );
	
	$links = disectLinksFromJSON(issueLinkResults);
	
	$mainIssue = [];
	$mainIssue["id"] = issueLinkResults["key"];
	
	if ($links[3] == 0 ) {
		$templateCode.addClass("collapsed");
	}
	

	
	
	graph = Viva.Graph.graph();

	
	// Generate Nodes - for main issue first
	graph.addNode($mainIssue["id"]);
	
	// Links and nodes for Outward issue links
	for (var i = $links[0].length; i--; ) {
		$currentIssue = $links[0][i]["key"];
		graph.addNode($currentIssue, $links[0][i]);
		graph.addLink($mainIssue["id"], $currentIssue, { connectionStrength: 0.1 });
	}
	
	// Links and nodes for Inward issue links
	for (var i = $links[1].length; i--; ) {
		$currentIssue = $links[1][i]["key"];
		graph.addNode($currentIssue, $links[1][i]);
		graph.addLink($currentIssue, $mainIssue["id"], { connectionStrength: 0.1 });
	}
	
	
	// Links and nodes for subtasks
	for (var i = $links[2].length; i--; ) {
		$currentIssue = $links[2][i]["key"];
		graph.addNode($currentIssue, $links[2][i]);
		graph.addLink($mainIssue["id"], $currentIssue, { connectionStrength: 0.1, linkType: "subtask" });
	}
	

	// Node display profile (how each issue will be displayed)
	graphics = Viva.Graph.View.svgGraphics(),
	nodeSize = 1;
	
	defineArrow(graphics.getSvgRoot());
	
	// Issue node link representation
	//
	// Description of the links between nodes
	//
	graphics.link(function(link) {
		
		var svgPath = Viva.Graph.svg('path');
		if (typeof( link.data.linkType ) != 'undefined') {
			svgPath.attr('stroke-dasharray', '5, 5');
		}
		return svgPath
		  .attr('stroke', 'black')
		  .attr('marker-end', 'url(#Triangle)');
		}).placeLink(placeArrow(groupSize ));	
	
	// Issue node visual representation
	// 
	// All the transforms, text and colors are described below for each issue link
	//
	graphics.node(function(node) {
		
			/*
			chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
				console.log(node.id);
			});	
		*/
		
		$url = window.location.toString()
		$issueId = $url.match(/\/([^\/]+)\/?$/)[1];
		$issueUrl = $url.substring(0, $url.indexOf("/browse")) + "/browse";
		
		boundingboxColor = 'gray';
        // The function is called every time renderer needs a ui to display node
    	var ui = Viva.Graph.svg('g'),
			// Create SVG text element with issue id as content
			svgText = Viva.Graph.svg('text').attr('y', '32px').attr('x', '1px').text(node.id);
			

			
			if (typeof( node.data ) != 'undefined') {

				svgIssueType = Viva.Graph.svg('image')
						 .attr('width', 16)
						 .attr('height', 16)
						 .attr('x', '1px')
						 .attr('y', '1px')
						 .link(node.data["fields"]["issuetype"]["iconUrl"]);
				svgPriority = Viva.Graph.svg('image')
						 .attr('width', 16)
						 .attr('height', 16)
						 .attr('x', '20px')
						 .attr('y', '1px')
						 .link(node.data["fields"]["priority"]["iconUrl"]);		 
						

				
				ui.append(svgIssueType);	
				ui.append(svgPriority);	
				

			

			
				// Change color of bounding box depending on status of issue
				if ($.inArray(node.data["fields"]["status"]["name"], boundingBoxOneArray) != -1) {
					boundingboxColor = boundingBoxOneColor;
					svgTextStatusName = Viva.Graph.svg('text').attr('y', '48px').attr('x', '1px').text(node.data["fields"]["status"]["name"]);
					ui.append(svgTextStatusName);
				}
				else if ($.inArray(node.data["fields"]["status"]["name"], boundingBoxTwoArray) != -1) {
					boundingboxColor = boundingBoxTwoColor;
					svgTextStatusName = Viva.Graph.svg('text').attr('y', '48px').attr('x', '1px').text(node.data["fields"]["status"]["name"]);
							ui.append(svgTextStatusName);
				}
				else {
					boundingboxColor = 'red';
					svgTextStatusName = Viva.Graph.svg('text').attr('y', '48px').attr('x', '1px').text(node.data["fields"]["status"]["name"]);
							ui.append(svgTextStatusName);
				}
								

			}
			/*
				$(actualElement).click(function() { // mouse over
					window.open($issueUrl+"/"+node.id, "_blank");
				});		
			*/		
		
			var rect = Viva.Graph.svg('rect')
				.attr('width', groupSize)
				.attr('height', groupSize)
				.attr('stroke', boundingboxColor)
				.attr('stroke-width', '2px')
				.attr('rx', '2').attr('ry', '2')
				.attr("fill", "transparent");
				
		ui.append(rect);
		ui.append(svgText);

		

		
		return ui;
    })
    .placeNode(function(nodeUI, pos){
		// 'g' element doesn't have convenient (x,y) attributes, instead
		// we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
		nodeUI.attr('transform',
					'translate(' +
						  (pos.x - groupSize / 2) + ',' + (pos.y - groupSize / 2 ) +
					')');
    });
	
	
	
	// Attach Data to Graph
	$templateCode.appendTo($targetId);

	// Set listeners for toolbox
	$("a.issueLink-fullscreen").click(function () {fullScreen()});
	
	// Listener for if user clicks on the outside div in modal view
	window.onclick = function(event) {
		if ($("div#linkVisualiser.modal").is(event.target)) {
			fullScreen();
		}
	}
	  
	  //Space out graph depending on the number of issues
	  if  ($links[3] >= 9)
	  {		  
		idealLength = idealLength * ( $links[3] * 0.145 );
	  }
	  
	  layout = Viva.Graph.Layout.forceDirected(graph, {
		  springLength: idealLength,
		  // springCoeff : 0.0008,
		  // gravity : -10,

		  springTransform: function (link, spring) {
			spring.length = idealLength * (1 - link.data.connectionStrength);
		  }
	  });
	
	// run layout for as many iterations as we want:
    for (var i = 0; i < 500; ++i) {
          layout.step();
    }
	
	
	renderer = Viva.Graph.View.renderer(graph, {
	  container: document.getElementById('linkGraph'),
	  graphics : graphics,
	  layout : layout,
      prerender  : true
	});

	// Select the currently open issue and put it in var 'nodeId'
	nodeId = $mainIssue["id"];
	//adjustView(nodeId, layout);

	
	renderer.run();	
	$("div#linkGraph > svg").attr("style", "border-style: groove;min-height:380px;");

	// Following 2 lines bring the graph back centre when minimizing from fullscreen
	$("div#linkGraph ").attr("viewBox", "0 0 300 300");
	$("div#linkGraph").attr("preserveAspectRatio", "xMinYMin meet");
	
	var check = function(){
		adjustView(nodeId, layout);
	}

	setTimeout(check, 200); // check again in a second

	//$renderer.reset();	
}

// Pull the issue details via the REST API in JIRA
function getIssueLinks(){
	$url = window.location.toString()
	$issueId = $url.match(/\/([^\/]+)\/?$/)[1];
	$restAPI = $url.substring(0, $url.indexOf("/browse")) + "/rest/api/2";
	
	$getIssueURL = $restAPI + "/issue/" + $issueId + "?fields=issuelinks,issuetype,subtasks";
    //alert(restAPI);
	
	var linkResults = $.getJSON($getIssueURL, function( $data ) {
		// Get current issue link issues
		//$links = disectLinksFromJSON($data);
		
		// Get the current issue relevant data
		//$iconURL = $data["fields"]["issuetype"]["iconURL"];
		//$iconURL= $data["fields"]["issuetype"]["name"];
		
		
/* 		chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
			console.log($links[0][0]);
		}); */
		
		
		generateView($data);
	});
	
	
	//$test = jQuery.parseJSON($linkResults);
		
		
	return 1;
}

// SVG arrow function
function defineArrow(svgRoot) {
  var marker = createMarker('Triangle');
  marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');
  var defs = svgRoot.append('defs');
  defs.append(marker);
  function createMarker(id) {
    return Viva.Graph.svg('marker')
      .attr('id', id)
      .attr('viewBox', "0 0 10 10")
      .attr('refX', "10")
      .attr('refY', "5")
      .attr('markerUnits', "strokeWidth")
      .attr('markerWidth', "15")
      .attr('markerHeight', "15")
      .attr('orient', "auto");
  }
}


// SVG arrow placement function
function placeArrow(groupSize) {
  var geom = Viva.Graph.geom();
  return function (linkUI, fromPos, toPos) {
    var toNodeSize = groupSize,
      fromNodeSize = groupSize;
    var from = geom.intersectRect(
      // rectangle:
      fromPos.x - fromNodeSize / 2, // left
      fromPos.y - fromNodeSize / 2, // top
      fromPos.x + fromNodeSize / 2, // right
      fromPos.y + fromNodeSize / 2, // bottom
      // segment:
      fromPos.x, fromPos.y, toPos.x, toPos.y) || fromPos; // if no intersection found - return center of the node
    var to = geom.intersectRect(
      // rectangle:
      toPos.x - toNodeSize / 2, // left
      toPos.y - toNodeSize / 2, // top
      toPos.x + toNodeSize / 2, // right
      toPos.y + toNodeSize / 2, // bottom
      // segment:
      toPos.x, toPos.y, fromPos.x, fromPos.y) || toPos; // if no intersection found - return center of the node
    var data = 'M' + from.x + ',' + from.y +
      'L' + to.x + ',' + to.y;
    linkUI.attr("d", data);
  }
}


// Main App
getIssueLinks();

