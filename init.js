plugin.enableAutodetect = true;
plugin.eraseWithDataDefault = false;
plugin.navBarToBottom = true;

plugin.statusFilter = {downloading: 1, completed: 2, all: 3};
plugin.torrents = null;
plugin.torrent = undefined;
plugin.lastHref = "";
plugin.currFilter = plugin.statusFilter.all;
plugin.labelInEdit = false;
plugin.eraseWithDataLoaded = false;

var pageToHash = {
	'torrentsList': '',
	'torrentDetails': 'details',
	'globalSettings': 'settings',
	'addTorrent': 'add',
	'confimTorrentDelete': 'delete'
};

var detailsIdToLangId = {
	'status' : "Status",
	'done' : "Done",
	'downloaded' : 'Downloaded',
	'timeElapsed' : "Time_el",
	'remaining' : "Remaining",
	'ratio' : "Ratio",
	'downloadSpeed' : "Down_speed",
	'wasted' : "Wasted",
	'uploaded' : "Uploaded",
	'uploadSpeed' : "Ul_speed",
	'seeds' : "Seeds",
	'peers' : "Peers",
	'label' : 'Label'
};

plugin.toogleDisplay = function(s) {
	if (s.css('display') == 'none')
		s.css('display', '')
	else
		s.css('display', 'none');
}

plugin.backListener = function() {
	if (this.lastHref != window.location.href) {
		if (window.location.hash == '#details') {
			if (this.torrent != undefined)
				this.showDetails(this.torrent.hash);
		} else if (window.location.hash == '#settings') {
			this.showSettings();
		} else if (window.location.hash == '#add') {
			this.addTorrent();
		} else if (window.location.hash == '#delete') {
			if (this.torrent != undefined)
				this.delete();
		} else {
			this.showList();
		};
	};
};

plugin.request = function(url, func) {
	theWebUI.requestWithTimeout(url, function(d){if (func != undefined) func(d);}, function(){}, function(){});
};

plugin.setHash = function(page) {
	window.location.hash = pageToHash[page];
	this.lastHref = window.location.href;
	window.scrollTo(0,0);
}

plugin.showPage = function(page) {
	$('.mainContainer').css('display', 'none');
	$('.torrentControl').css('display', 'none');
	$('#' + page).css('display', 'block');
	this.setHash(page);
};

plugin.showList = function() {
	this.showPage('torrentsList');
};

plugin.filter = function(f, self) {
	var downloadingDisplay = (f & this.statusFilter.downloading) != 0 ? '' : 'none';
	var completedDisplay = (f & this.statusFilter.completed) != 0 ? '' : 'none';

	$('.statusDownloading').css({display: downloadingDisplay});
	$('.statusCompleted').css({display: completedDisplay});

	if (self != undefined) {
		$('#torrentsList ul li').removeClass('active');
		$(self).parent().addClass('active');
	}
	this.currFilter = f;
};

plugin.showSettings = function() {
	this.request("?action=gettotal", function(total) {
		$('#dlLimit').html('');
		$('#ulLimit').html('');

		var speeds = theWebUI.settings["webui.speedlistdl"].split(",");

		for (var i = 0; i < speeds.length; i++) {
			var spd = speeds[i] * 1024;

			$('#dlLimit').append('<option' + (spd == total.rateDL ? ' selected' : '') + ' value="' + spd + '">' +
				theConverter.speed(spd) + '</option>');
		};
		$('#dlLimit').append('<option' + ((total.rateDL <= 0 || total.rateDL >= 100*1024*1024) ? ' selected' : '') +
			' value="' + 100 * 1024 * 1024 + '">' + theUILang.unlimited + '</option>');

		speeds=theWebUI.settings["webui.speedlistul"].split(",");

		for (var i = 0; i < speeds.length; i++) {
			var spd = speeds[i] * 1024;

			$('#ulLimit').append('<option' + (spd == total.rateUL ? ' selected' : '') + ' value="' + spd + '">' +
				theConverter.speed(spd) + '</option>');
		};
		$('#ulLimit').append('<option' + ((total.rateUL <= 0 || total.rateUL >= 100*1024*1024) ? ' selected' : '') +
			' value="' + 100 * 1024 * 1024 + '">' + theUILang.unlimited + '</option>');

		plugin.showPage('globalSettings');
	});
};

plugin.setDLLimit = function() {
	theWebUI.setDLRate($('#dlLimit').val());
};

plugin.setULLimit = function() {
	theWebUI.setULRate($('#ulLimit').val());
};

plugin.addTorrent = function() {
	this.showPage('addTorrent');
};

plugin.fillLabel = function(label) {
	if (this.labelInEdit)
		return;

	$('#torrentDetails #label td:last').text(label + ' ')
		.append('<button class="btn btn-small" type="button" onclick="mobile.editLabel();"><i class="icon-edit"></i></button>');
};

plugin.fillDetails = function(d) {
	$('#torrentName').text(d.name);

	var percent = d.done / 10.0;
	$('#torrentProgress').removeClass('active');
	if (d.done != 1000) {
		$('#torrentProgress').addClass('active');
	}
	$('#torrentProgress .bar').css('width', percent + '%');
	$('#torrentProgress .bar').text(percent + '%');

	$('#torrentDetails #status td:last').text(theWebUI.getStatusIcon(d)[1]);
	this.fillLabel(d.label);
	$('#torrentDetails #done td:last').text(percent + '%');
	$('#torrentDetails #downloaded td:last').text(theConverter.bytes(d.downloaded,2));
	$('#torrentDetails #timeElapsed td:last').text(theConverter.time(Math.floor((new Date().getTime()-theWebUI.deltaTime)/1000-iv(d.state_changed)),true));
	$('#torrentDetails #remaining td:last').html((d.eta ==- 1) ? "&#8734;" : theConverter.time(d.eta));
	$('#torrentDetails #ratio td:last').html((d.ratio ==- 1) ? "&#8734;" : theConverter.round(d.ratio/1000,3));
	$('#torrentDetails #downloadSpeed td:last').text(theConverter.speed(d.dl));
	$('#torrentDetails #wasted td:last').text(theConverter.bytes(d.skip_total,2));
	$('#torrentDetails #uploaded td:last').text(theConverter.bytes(d.uploaded,2));
	$('#torrentDetails #uploadSpeed td:last').text(theConverter.speed(d.ul));
	$('#torrentDetails #seeds td:last').text(d.seeds_actual + " " + theUILang.of + " " + d.seeds_all + " " + theUILang.connected);
	$('#torrentDetails #peers td:last').text(d.peers_actual + " " + theUILang.of + " " + d.peers_all + " " + theUILang.connected);
};

plugin.editLabel = function() {
	plugin.labelInEdit = true;
	$('#torrentDetails #label td:last')
		.html('<div class="input-append">' +
			'<input class="span2" id="labelEdit" size="16" type="text" value="' + plugin.torrent.label +'" style="margin-right:0;height:15px;"/>' +
			'<button class="btn"><i class="icon-ok"></i></button></div>');
	$('#labelEdit').focus();
	$('#labelEdit').blur(function() {
		var newLabel = $('#labelEdit').val();
		plugin.labelInEdit = false;
		plugin.fillLabel(newLabel);

		if (plugin.torrent.label != newLabel) {
			plugin.torrent.label = newLabel;
			plugin.torrents[plugin.torrent.hash].label = newLabel;

			plugin.request('?action=setlabel&hash=' + plugin.torrent.hash + '&s=label&v=' + encodeURIComponent(newLabel));
		};
	});
};

plugin.showDetails = function(e) {
	this.torrent = this.torrents[e];
	if (this.torrent == undefined)
		return;

	this.torrent.hash = e;
	var d = this.torrent;

	this.fillDetails(d);

	this.showPage('torrentDetails');
	$('.torrentControl').css('display', '');
	this.showDetailsInDetails();
};

plugin.showDetailsInDetails = function() {
	$('.detailsPage').css('display', 'none');
	$('#detailsDetailsPage').css('display', '');
	$('#detailsNav li').removeClass('active');
	$('#detailsDetailsTab').addClass('active');
};

plugin.showTrackersInDetails = function() {
	$('.detailsPage').css('display', 'none');
	$('#detailsTrackersPage').css('display', '');
	$('#detailsNav li').removeClass('active');
	$('#detailsTrackers').addClass('active');
	this.loadTrackers();
}

plugin.showFilesInDetails = function() {
	$('.detailsPage').css('display', 'none');
	$('#detailsFilesPage').css('display', '');
	$('#detailsNav li').removeClass('active');
	$('#detailsFiles').addClass('active');
	this.loadFiles();
}

plugin.toogleTrackerInfo = function(s) {
	this.toogleDisplay($(s).parent().find('div'));
}

plugin.loadTrackers = function() {
	if (this.torrent != undefined) {
		var hash = this.torrent.hash;
		this.request('?action=gettrackers&hash=' + hash, function(data) {
			var trackers = data[hash];
			if (hash == mobile.torrent.hash) {
				var trackersHtml = '';

				for (var i = 0; i < trackers.length; i++) {
					trackersHtml +=
						'<div>' +
						'<a style="padding: 5px;" href="javascript://void();" onclick="mobile.toogleTrackerInfo(this);">' + trackers[i].name + '</a>' +
						'<div style="display:none;">' +
							'<table class=" table table-striped"><tbody>' +
								'<tr><td>' + theUILang.Type + '</td><td>' + theFormatter.trackerType(trackers[i].type) + '</td></tr>' +
								'<tr><td>' + theUILang.Enabled + '</td><td>' + theFormatter.yesNo(trackers[i].enabled) + '</td></tr>' +
								'<tr><td>' + theUILang.Group + '</td><td>' + trackers[i].group + '</td></tr>' +
								'<tr><td>' + theUILang.Seeds + '</td><td>' + trackers[i].seeds + '</td></tr>' +
								'<tr><td>' + theUILang.Peers + '</td><td>' + trackers[i].peers + '</td></tr>' +
								'<tr><td>' + theUILang.scrapeDownloaded + '</td><td>' + trackers[i].downloaded + '</td></tr>' +
								'<tr><td>' + theUILang.scrapeUpdate + '</td><td>' +
									(trackers[i].last ? theConverter.time($.now() / 1000 - trackers[i].last - theWebUI.deltaTime / 1000, true) : '') +
									'</td></tr>' +
								'<tr><td>' + theUILang.trkInterval + '</td><td>' + theConverter.time(trackers[i].interval) + '</td></tr>' +
								'<tr><td>' + theUILang.trkPrivate + '</td><td>' + theFormatter.yesNo(theWebUI.trkIsPrivate(trackers[i].name)) + '</td></tr>' +
							'</tbody></table>' +
						'</div></div><hr>';
				}

				trackersHtml += '';
				$('#detailsTrackersPage').html(trackersHtml);
			}
		});
	}
};

plugin.files = undefined;
plugin.drawFiles = function(p) {
	var path = p.split('/');
	if ((path[0] == '') && (path.length == 1))
		path = [];

	var dir = plugin.files;
	var realPath = '';
	for (var i = 0; i < path.length; i++) {
		if (path[i] == '')
			continue;

		if ((dir.container[path[i]] != undefined) && (dir.container[path[i]].directory)) {
			dir = dir.container[path[i]];
			realPath += '/' + path[i];
		} else {
			break;
		}
	}

	realPath = realPath.substr(1);

	var filesHtml = '';

	if (!dir.root) {
		var i = realPath.lastIndexOf('/');
		if (i < 0)
			i = 0;
		var upperDir = realPath.substr(0, i);
		filesHtml += '<a href="javascript://void();" onclick="mobile.drawFiles(\'' + upperDir + '\');">' +
						'<i class="icon-folder-open"></i> ..</a><hr>';
	}

	for (name in dir.container) {
		if (dir.container[name].directory) {
			filesHtml += '<a href="javascript://void();" onclick="mobile.drawFiles(\'' + realPath + '/' + name + '\');">' +
				'<i class="icon-folder-open"></i>&nbsp;' + name + '</a><hr>';
		} else {
			var idName = 'file' + dir.container[name].id;
			filesHtml += '<a href="javascript://void();" onclick="mobile.toogleDisplay($(\'#' + idName + '\'));">' +
				'<i class="icon-file"></i>&nbsp;' + name + '</a><div style="display:none;" id="' + idName + '">' +
				'<table class="table table-striped"><tbody>' +
					'<tr><td>' + theUILang.Done + '</td><td>' + theConverter.bytes(dir.container[name].done) + '</td></tr>' +
					'<tr><td>' + theUILang.Size + '</td><td>' + theConverter.bytes(dir.container[name].size) + '</td></tr>' +
				'</tbody></table></div><hr>';
		}
	}

	$('#detailsFilesPage').html(filesHtml);
}

plugin.loadFiles = function() {
	if (this.torrent != undefined) {
		var hash = this.torrent.hash;
		$('#detailsFilesPage').html('');
		this.request('?action=getfiles&hash=' + hash, function(data) {
			var rawFiles = data[hash];
			var files = {root: true, directory: true, container: {}};

			for (var i = 0; i < rawFiles.length; i++) {
				var path = rawFiles[i].name.split('/');

				var currDir = files;
				for (var j = 0; j < path.length -1; j++) {
					if (currDir.container[path[j]] == undefined)
						currDir.container[path[j]] = {directory: true, root: false, container: {}};
					currDir = currDir.container[path[j]];
				}
				currDir.container[path[path.length - 1]] = {root: false,
					directory: false,
					size: rawFiles[i].size,
					done: rawFiles[i].done,
					id: i
				};
			}

			mobile.files = files;
			mobile.drawFiles('');
		});
	}
}

plugin.start = function() {
	if (this.torrent != undefined) {
		var status = this.torrent.state;

		if ((!(status & dStatus.started) || (status & dStatus.paused) && !(status & dStatus.checking) && !(status & dStatus.hashing))) {
			this.request('?action=start&hash=' + this.torrent.hash);
		}
	}
};

plugin.stop = function() {
	if (this.torrent != undefined) {
		var status = this.torrent.state;

		if ((status & dStatus.started) || (status & dStatus.hashing) || (status & dStatus.checking)) {
			this.request('?action=stop&hash=' + this.torrent.hash);
		}
	}
};

plugin.pause = function() {
	if (this.torrent != undefined) {
		var status = this.torrent.state;

		if (((status & dStatus.started) && !(status & dStatus.paused) && !(status & dStatus.checking) && !(status & dStatus.hashing))) {
			this.request('?action=pause&hash=' + this.torrent.hash);
		} else if (((status & dStatus.paused) && !(status & dStatus.checking) && !(status & dStatus.hashing))) {
			this.request('?action=unpause&hash=' + this.torrent.hash);
		}
	}
};

plugin.delete = function() {
	if (this.torrent == undefined)
		this.showList();
	else {

		if (theWebUI.settings["webui.confirm_when_deleting"]) {
			$('#confimTorrentDelete h5').text(theUILang.areYouShure + ' ' + this.torrent.name);
			if ((this.eraseWithDataLoaded) && (this.eraseWithDataDefault != undefined)) {
					$('#deleteWithData input').attr('checked', this.eraseWithDataDefault);
			}
			this.showPage('confimTorrentDelete');
		} else {
			this.deleteConfimed();
		}
	}
};

plugin.deleteConfimed = function() {
	if ((this.eraseWithDataLoaded) && ($('#deleteWithData input').attr('checked'))) {
		this.request('?action=removewithdata&hash=' + this.torrent.hash);
	} else {
		this.request('?action=remove&hash=' + this.torrent.hash);
	}
	this.torrent = undefined;
	this.showList();
};

plugin.update = function() {
	theWebUI.requestWithTimeout("?list=1&getmsg=1",
		function(data) {
			plugin.torrents = data.torrents;

			var listHtml = '<table class="table table table-striped"><tbody>';

			$.each(data.torrents, function(n, v){
				var status = theWebUI.getStatusIcon(v);
				var statusClass = (v.done == 1000) ? 'Completed' : 'Downloading';
				var percent = v.done / 10;

				v.hash = n;

				listHtml +=
					'<tr id="' + n + '" class="torrentBlock status' + statusClass + '" onclick="mobile.showDetails(this.id);"><td>' +
						'<h5>' + v.name + '</h5>' + status[1] +
						'<div class="progress progress-striped' + ((v.done == 1000) ? '' : ' active') + '">' +
							'<div class="bar" style="width: ' + percent + '%;">' + percent + '%</div>' +
						'</div>' +
					'</td></tr>';
			});

			listHtml += '</tbody></table>';

			$('#torrentsList #list').html(listHtml);
			plugin.filter(plugin.currFilter);

			if (plugin.torrent != undefined) {
				if (plugin.torrents[plugin.torrent.hash] != undefined) {
					plugin.torrent = plugin.torrents[plugin.torrent.hash];
					plugin.fillDetails(plugin.torrent);
				} else {
					plugin.showList();
				}
			}

			setTimeout(function() {plugin.update();}, theWebUI.settings['webui.update_interval']);
		},

		function()
		{
			//TODO: Timeout
		},

		function(status,text)
		{
			//TODO: Error
		}
	);
};

plugin.init = function() {
	var start = (window.location.href.indexOf('mobile=1') > 0);

	if ((!start) && this.enableAutodetect) {
		start = jQuery.browser.mobile;
	}

	if (start) {
		this.lastHref = window.location.href;

		setInterval(function() {plugin.backListener();}, 500);

		$.ajax({
			type: 'GET',
			url: this.path + 'mobile.html',
			processData: false,

			error: function(XMLHttpRequest, textStatus, errorThrown) {
				//TODO: Error
			},

			success: function(data, textStatus) {
				$('body').html(data);

				$('link[rel=stylesheet]').remove();
				plugin.loadMainCSS();
				plugin.loadCSS('css/bootstrap.min');
				//injectScript(plugin.path+'js/bootstrap.min.js'); //I want this for accordeon, but jQuery is too old =(

				if (mobile.navBarToBottom) {
					$('#mainNavbar').addClass('navbar-fixed-bottom');
					$('#mainContainer').css('padding-bottom', '46px');
				} else {
					$('#mainNavbar').addClass('navbar-fixed-top');
					$('#mainContainer').css('padding-top', '46px');
				}

				$('.torrentControl').css('display', 'none');

				$('#dlLimit').change(function(){plugin.setDLLimit();});
				$('#ulLimit').change(function(){plugin.setULLimit();});

				$('input[id=torrent_file]').change(function() {
				   $('#torrentFileName').val($(this).val());
				});

				$('#dirLabel').text(theUILang.Base_directory);
				$('#addLabelLabel').text(theUILang.Label);
				$('#notAddPath').append(' ' + theUILang.Dont_add_tname);
				$('#startStopped').append(' ' + theUILang.Dnt_start_down_auto);
				$('#fastResume').append(' ' + theUILang.doFastResume);
				$('#torrentFileSend').text(theUILang.add_button);

				plugin.loadLang();

				if (rTorrentStub.prototype.removewithdata != undefined) {
					$('#confimTorrentDelete h5').after(
						'<label class="checkbox inline" id="deleteWithData" style="margin-bottom:5px;">' +
						'<input type="checkbox" style="margin-bottom:5px;"> ' + theUILang.Delete_data + '</label><br/>');

					plugin.eraseWithDataLoaded = true;
				}

				plugin.update();
			}
		});
	} else {
		this.disable();
	}
};

plugin.onLangLoaded = function() {
	$('#torrentsAll a').text(theUILang.All);
	$('#torrentsDownloading a').text(theUILang.Downloading);
	$('#torrentsCompleted a').text(theUILang.Finished);

	$('#detailsDetailsTab a').text(theUILang.General);
	$('#detailsTrackers a').text(theUILang.Trackers);
	$('#detailsFiles a').text(theUILang.Files);

	$('#torrentDetails table tr').each(function(n, v) {
		$(v).children('td:first').text(theUILang[detailsIdToLangId[v.id]]);
	});

	$('#dlLimit').parent().children('h6').text(theUILang.Glob_max_downl);
	$('#ulLimit').parent().children('h6').text(theUILang.Global_max_upl);
	$('#speedLimitsOk').text(theUILang.ok);
	$('#speedLimitsCancel').text(theUILang.Cancel);

	$('#torrentURL').text(theUILang.Torrent_URL+':');
	$('#addUrl').text(theUILang.add_url);

	$('#deleteOk').text(theUILang.ok);
	$('#deleteCancel').text(theUILang.Cancel);
};

/**
 * jQuery.browser.mobile (http://detectmobilebrowser.com/)
 *
 * jQuery.browser.mobile will be true if the browser is a mobile device
 *
 **/
(function(a){jQuery.browser.mobile=/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);

mobile = plugin;
plugin.init();