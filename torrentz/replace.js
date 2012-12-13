$(document).ready(function(){

	// Magnet Image: http://magnet-uri.sourceforge.net/
	var RedImageData = 'data:image/gif;base64,R0lGODlhDgAOAPcAAAAAAGNjY97e3v8AAP8ICP////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'//////////////////////////////////////////////////////////////////////////////////////' +
					'/////////////////////////////////yH5BAEAAAUALAAAAAAOAA4AAAhhAAEIHFigwMCDAhIKAFAQgMKFDh' +
					'UyNPhQYMWGFQEMGEAAQICCAQAQGClwY8eCDUd21MhxYkqSLE+iFAlz4wCPIGmutHlzoMqOAXja/EkgQEihHFXi' +
					'DMnS5MqPKI0eNIoyIAA7';

	var GreyImageData = 'data:image/gif;base64,R0lGODlhDgAOAMIFAAAAAGNjY97e3v8AAP8ICP///////////yH5BAEAAAcALAAAAAAOAA4AAAM1CLp3+yIK0ICcVlJ3Va8dEIxiE4gkejbVeKpbm7qxQ8OBCauv4r6/IO0k/JWAQR/r0FvkGgkAOw==';

	// URL Regex
	var urlExpr = /\/([a-f0-9]{40})/;

	// Determine if this is a torrent page
	var downloadBlock = $("div.download");
	var trackersBlock = $("div.trackers");

	if(downloadBlock.length == 1 && trackersBlock.length == 1) {
		// Grab the DOM Nodes
		downloadBlock = downloadBlock.eq(0);
		trackersBlock = trackersBlock.eq(0);

		// Get the infohash
		var infoHash = window.location.href.match(urlExpr)[1];

		// Get the title
		var title = escape( $("h2 > span", downloadBlock).text() );

		// Get the trackers
		var trackers = "";
		$("dl > dt > a", trackersBlock).each(function(){
				trackers += "&tr=" + escape(this.innerHTML);
		});

		// Create the magnet link
		var magnetUri = "magnet:?xt=urn:btih:" + infoHash + "&dn=" + title + trackers;

		// Magnet Link
		var newHTML = '<dl><dt><a href="' + magnetUri + '"><span class="u" style="background: transparent url(' + RedImageData +') no-repeat 5px center;" font-size: 16px">Magnet Link</span></a></dt></dl>';

		var links = $("dl", downloadBlock)
		for(i in links){
			links.eq(i).hide();
		}

		var otherDownloads = '<dl class="otherDownloads"><dt><a><span class="u" font-size: 16px">Other Downloads</span></a></dt></dl>';

		// Add New Links
		links.eq(0).before(newHTML);
		links.eq(0).before(otherDownloads);

		$('dl.otherDownloads').bind(
			"click",
			function(){
				var links = $("dl", "div.download");
				for(i in links){
					links.eq(i).show();
				}
				links.eq(1).hide();
			}
		);

	}

	// Add magnet icons to the related torrents
	$("div.results").each(function(){
		var block = this;

		// For each result
		$("dl > dt", block).each(function(){
			// Grab the dt
			var dt = this;

			// Grab the torrent details
			var link = $("a", dt);
			var title = escape( link.text() );

			var href = link.attr('href');
			if(href == null)
				return;

			var infoHash = href.match(urlExpr);
			if(infoHash == null)
				return;

			// Get the hash from the link
			infoHash = infoHash[1]

			// Set the initial magnet link without trackers, we'll update it later
			dt.innerHTML = '<a href="magnet:?xt=urn:btih:' + infoHash + '&dn=' + title + '" title="Magnet Link"><img src="' + GreyImageData + '" alt="Magnet Link" border="0" width="14" height="14"/></a>&nbsp;' + dt.innerHTML;

			// Grab the link so we can update the URI later
			link = $("a", dt).first();

			// ajax function to add trackers to each link
			link.hover( function () {
				// Don't do this if we've done it before
				if(!link.hasClass('tracked')){
					// Asynchronous grab for trackers
					$.ajax({
						url: window.location.protocol + "//" + window.location.hostname + "/" + infoHash,
						dataType: "text",
						tryCount : 0,
						retryLimit : 3,
						success : function(response) {
							// Regex to catch trackers
							var regex = /tracker_[0-9]*\">([^<]*)</g

							// Generate the tracker list
							var trackers = "";
							var match = regex.exec(response);
							while (match != null){
								trackers += "&tr=" + escape(match[1]);
								match = regex.exec(response);
							}

							// Generate the new url
							var href = "magnet:?xt=urn:btih:" + infoHash + "&dn=" + title + trackers;
							link.attr("href", href);
							$("img",link).first().attr("src", RedImageData);
							link.addClass('tracked')
						},
						error : function(xhr, textStatus, errorThrown ) {
							if (errorThrown == 'Service Temporarily Unavailable') {
								this.tryCount++;
								if (this.tryCount <= this.retryLimit) {
									//try again
									console.log("retrying...");
									$.ajax(this);
									return;
								}
								console.log("Failed to add trackers to magnet link!");
								return;
							}
						}
					});
				}
			});
		});
	});
});

