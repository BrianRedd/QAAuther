/*--------------------------------------------------------

* Filename: scripts.js
* Description: JS file for QAAuther page

* Author: R. Brian Redd

--------------------------------------------------------*/   

/*FUNCTIONS*/

$(document).ready(function () {
	
	var version = "6.1.0";
	//$("title").text("QA Authenticator Tool (QAAuther) ver " + version);
	
	console.log(ParFilter);
	if (!ParFilter) {
		ParFilter = "Olive";
	}
	
	/*Server variable*/
	//var Serv32 = new Array(89,88,82);
	var Serv64 = new Array("zone1-appsrvr1","zone1-appsrvr2","zone1-appsrvr3","zone1-appsrvr4","zone2-appsrvr1","zone2-appsrvr2","zone2-appsrvr3"); //5.2.3
	var Serv64id = new Array("Z1A1","Z1A2","Z1A3","Z1A4","Z2A1","Z2A2","Z2A3"); //5.2.3
	var IdxSvr = "connect.olivesoftware.com"; //Index server Address
	var dCP = { //default CP codes; application:code v5.0.5
		"iReader":"132436",
		"OMV":"142856",
		"ODN":"220222"
	};
	
	var StatusText = new Array("Live", "In Progress", "Dead", "Internal Test"); //enumerated "status" values, [4.7]
	var AuthType = new Array("Standard", "Free", "Trial", "External"); //5.1.0
	
	/*set variables*/
	var AuthURL, SkinURL, loginurl, readerval, date, userid, rvalue;
	var SLink = new Array();
	var loading = true;
	var preload = false; //query string parameters applied? new with 4.7.11
	var timestamp; //data timestamp
	var Key;
	var yyyy, dd, mm;
	var authpreference = "HIDE"; //4.9
	
	//jQuery selector variables
	var dispFrame$ = $("#dispframe");
	var navFrame$ = $("#navframe");
	var navList$ = $("#navlist"); //5.1.0
	var filtButt$ = $("#filtButt");
	var resetButt$ = $("#resetButt");
	var refButt$ = $("#refButt");
	var expButt$ = $("#list_export"); //5.1.0
	var appDD$ = $("#filter #application");
	var apvDD$ = $("#filter #applicationversion"); //4.6
	var parentDD$ = $("#filter #parentorg");
	var helpButt$ = $("#helpbutton");
	var help$ = $("#help");
		help$.find(".pageversion").text(version);
	var reloadButt$ = $("#reloadbutton");
	var form$ = $("#filter");
	var workFrame$ = $("#workframe");
	var dialog$ = $("#dialog");
	var processer$ = $("#processer"); //4.4.0
	var confirm$ = $("#dialog-confirm");
	var sitesumm$ = $("#sitesummary"); //4.6.2
	var export$ = $("#export"); //5.1.0
	
	$(window).resize(function() {
		setNavFrame();
	});
	
	/*Non-Olive Modifications*/
	if (ParFilter != "Olive") {
		form$.find(".oliveonly").css("display","none");
		help$.find(".oliveonly").css("display","none");
		$("#parhdr").text(ParFilter + " / ");
		var temp = ParFilter.split(" ");
		var temp2 = temp[0] + "QA";
		document.filter.authid.value = temp2;
		help$.find("#qauserid").text(temp2);
	}
			
	/*jQuery UI buttons*/
	helpButt$.button();
	reloadButt$.button();
	filtButt$.button();
	resetButt$.button();
	refButt$.button();
	expButt$.button(); //5.1.0
	$("#formbutts").buttonset();
	processer$.find("#processAll").button(); //4.4.0
	processer$.find("#processSpecial").button(); //4.10
//	indexer$.find("#indexAll").button();
//	akclearer$.find("#akclearAll").button(); //4.3.5
	//form$.find("#rndauthid").button();
	
	/*jQuery UI dialog pop-outs*/
	dialog$.dialog({
		autoOpen: false,
		width: 850,
		closeOnEscape: true
	});
	
	confirm$.dialog({
		autoOpen: false,
		width: 500,
		closeOnEscape: true
	})
	
	processer$.dialog({
		autoOpen: false,
		width: 850,
		title: "Process Window",
		closeOnEscape: true
	});
	
	sitesumm$.dialog({
		autoOpen: false,
		width: 550,
		height: 300,
		title: "Site Summary",
		closeOnEscape: true
	});
	
	export$.dialog({ //5.1.0
		autoOpen: false,
		width: "80%",
		height: "800",
		title: "Export",
		closeOnEscape: true
	});
	
	/*set date*/
	function GetTheDate() {
		var thedate = new Date();
		yyyy = thedate.getUTCFullYear();
		mm = thedate.getUTCMonth() + 1;
		dd = thedate.getUTCDate();

		if (mm < 10) mm = "0" + mm;
		if (dd < 10) dd = "0" + dd;

		date = yyyy + "-" + mm + "-" + dd;
		
		document.filter.newdate.value = date;
	}
	
	form$.find("#newdate").datepicker({
		dateFormat: "yy-mm-dd",
		changeMonth: true,
		autoSize: true,
		showButtonPanel: true,
		showOtherMonths: true,
		selectOtherMonths: true
	})
	
	date = document.filter.newdate.value;
	
	processer$.find("#processdate").datepicker({
		dateFormat: "yy/mm/dd",
		changeMonth: true,
		autoSize: true,
		showButtonPanel: true,
		showOtherMonths: true,
		selectOtherMonths: true
	})

	//Set screen-size dependent "frame" sizes
	function setNavFrame() {
		navFrameHeight = parseInt(($(window).height()) - parseInt($("#controlframe").css("height"))) - 10 + "px";
		workFrame$.css({
			"height": navFrameHeight
		});
	};
	
	/*GET DATA VIA AJAX*/
	var xParent, xPub, xPrimary, xRepo, xApp, xVer, xDomain, xExt, xSkin, xWrapper, xNIE, xAuth, xLogin, xPass, xRest, xStatus, xCP, xSpcR, xTS;
	var NewLink = new Array();
	var ParentDD = new Array();
		ParentDD[0] = "Any";
		ParentDD[1] = "None";
	var AppDD = new Array();
		AppDD[0] = "All";
	var ApvDD = new Array(); //4.6
		ApvDD[0] = new Array("All"); //4.6
	
	/*LOAD XML DATA*/
	/*DEPRECIATED*/
	function loadXMLData() {
		console.log("Loading XML Data");
		$.ajax({
			url: "data/QAAutherData.xml",
			cache: false,
			dataType: "xml",
			success: parseXML
		});
	};
		
	function parseXML(xml) {
		timestamp = $(xml).find("TIMESTAMP").text();
		help$.find("#xmltimestamp").text(timestamp);

		if (ParFilter != "Olive") {
			var counter = 0; // ! ParFilter specific ! important !
		}
		$(xml).find("SITE").each(function(index) {
			xParent = $(this).find("Parent").text();
			xPub = unescape($(this).find("Publication").text()); //6.0.4
			xPrimary = $(this).find("Primary").text(); //primary skin [6.0]
			xRepo = $(this).find("Repo").text();
			xApp = $(this).find("App").text();
			xVer = $(this).find("Ver").text(); //4.6
			xDomain = $(this).find("Domain").text();
			xExt = $(this).find("External").text();
			xSkin = $(this).find("Skin").text();
			xWrapper = $(this).find("Wrapper").text(); //wrapper? [6.0]
			xNIE = $(this).find("NIE").text(); //is NIE? [4.3] 
			xAuth = $(this).find("Auth").text(); //Authentication method [4.3]
			xLogin = $(this).find("Login").text();
			xPass = unescape($(this).find("Passphrase").text()); //escaped[4.6.19]
			xRest = $(this).find("Rest").text();
			//xNoDemo = $(this).find("NoDemo").text();
			xStatus = $(this).find("Status").text(); //Dead? [4.3] //Was "Dead", changed to Status [4.7]
			xCP = $(this).find("CP").text(); //CP Code 4.10
			xSpcR = $(this).find("SpcRule").text(); //Special Rules
			xTS = $(this).find("TS").text(); //timestamp 6.0.0
			
			if (ParFilter == "Olive") {
				NewLink[index] = new setData(xParent, xPub, xPrimary, xRepo, xApp, xVer, xDomain, xExt, xSkin, xWrapper, xNIE, xAuth, xLogin, xPass, xRest, xStatus, xCP, xSpcR, xTS);
			} else {
				if (xParent == ParFilter) { // ! ParFilter specific ! important !
					NewLink[counter] = new setData(xParent, xPub, xPrimary, xRepo, xApp, xVer, xDomain, xExt, xSkin, xWrapper, xNIE, xAuth, xLogin, xPass, xRest, xStatus, xCP, xSpcR, xTS);
					counter++; // ! ParFilter specific ! important !
				}
			}
		});
		Sorter();
	}
	
	/*GET JSON DATA*/
	function loadJSONData() {
		console.log("Loading JSON Data");
		$.getJSON("data/QAAutherData.json", function(data) {
			timestamp = data.timestamp;
			var counter = 0;
			help$.find("#xmltimestamp").text(timestamp);
			console.log(timestamp);
			$.each(data.sites, function(index) {
				var site = this;
				if (ParFilter != "Olive" && ParFilter != site.Par) {
					//console.log("Not it!");
					return;
				} else {
					NewLink[counter] = new setData(site.Par, site.Pub, site.Primary, site.Repo, site.App, site.Ver, site.Dom, site.External, site.Skin, site.Wrapper, site.NIE, site.Auth, site.Login, site.Pass, site.Rest, site.Stat, site.CP, site.SpcR, site.TS);
					counter++;
				};
			});
			Sorter();
		});
	};
	
	function setData(par, pub, primary, rep, ap, ver, dom, ext, skn, wrap, nie, aut, log, pas, res, stat, cp, spr, ts) {
		var tempa;
		var tempb = "";
		this.parent = par;
			if (!par) this.parent = "";
		this.publication = unescape(pub); //6.0.4
		this.primary = primary;
		this.repo = rep;
		this.app = ap;
		this.ver = ver; //4.6
			if (!ver) this.ver = "";
		this.domain = dom;
			if (!dom) this.domain = "";
		this.skin = skn;
		this.wrapper = wrap; //0: none, 1: iOS, 2: Android, 3: Both
			if (!wrap) this.wrapper = 0;
		this.nie = nie;
			if (!nie) this.nie = false;
		this.auth = parseInt(aut);//[4.3]
			if (!this.auth) this.auth = 0;
		this.external = ext;
		this.login = log;
/*		this.passphrase = pas;
			if (!this.passphrase) {
				this.passphrase = "n/a";
			} else {
				this.passphrase = unescape(this.passphrase);
			}*/
		this.passphrase = (!pas) ? "n/a" : unescape(pas);
		this.restrictions = res;
			//if (this.restrictions != false) this.restrictions = true; //5.0.6
		this.stat = stat; //was "dead" now enumerated status
			if (!stat) this.stat = 0;
		this.cp = cp;
			if (!this.cp) this.cp = "";
		this.spcrule = spr;
			if (!this.spcrule) this.spcrule = "";
		this.ts = ts; //6.0.0
			if (!this.ts) this.ts = "";
		// checks
		if (!this.domain || (this.domain && this.stat == 1)) { 
			if (this.stat == 1 || this.stat == 3) {//4.7.4/5.1.2
				this.domain = "staging.olivesoftware.com";
			} else if (this.app == "iReader") {
				this.domain = "ireader.olivesoftware.com";
			} else if (this.app == "OMV") { 
				this.domain = "tablet.olivesoftware.com";
			} else if (this.app == "OTB") { //4.7.13
				this.domain = "ebook.olivesoftware.com";
			} else if (this.app == "APD") { //4.6
				this.domain = "activepaper.olivesoftware.com";
			} else if (this.app == "CET" || this.app == "CRT") { //4.8.4
				this.domain = "connect.olivesoftware.com";//4.9.3
			} else {
				this.domain = "digital.olivesoftware.com";
			}
		};
		
		//additional properties
		this.title = this.publication;
		this.classes = "";
		//KEEP - if (this.parent) this.classes += this.parent.toUpperCase().replace(/\W/g, "_") + " ";
		//KEEP - var tempp = this.publication.toLowerCase().split(":")
		//KEEP - this.classes += tempp[0].replace(/\W/g, "_") + " " ;
		if (this.primary) {
			tempb += "<abbr title='Primary Skin'><span class='ui-icon ui-icon-star'></span></abbr>"; //Primary Skin 6.0
		} else {
			this.classes += "nonprime ";
		}
		switch(this.wrapper) {
			case 0:
				this.classes += "nowrap ";
				break;
			case 1:
				this.classes += "ios ";
				tempb += "<abbr title='iOS Wrapper'><span class='custom-icon-ios'></span></abbr>";
				break;
			case 2:
				this.classes += "android ";
				tempb += "<abbr title='Android Wrapper'><span class='custom-icon-android'></span></abbr>";
				break;
			case 3:
				this.classes += "ios android ";
				tempb += "<abbr title='iOS Wrapper'><span class='custom-icon-ios'></span></abbr><abbr title='Android Wrapper'><span class='custom-icon-android'></span></abbr>";
				break;
		}
		switch(this.auth) {
			case 0:
				this.classes += "auth ";
				break;
			case 1:
				this.classes += "free ";
				tempb += "<abbr title='Free Site'><span class='ui-icon ui-icon-unlocked'></span></abbr>"; //Free
				break;
			case 2:
				this.title += " (Demo)";
				this.classes += "demo ";
				tempb += "<abbr title='Trial Site'><span class='ui-icon ui-icon-key'></span></abbr>"; //Trial
				break;
			case 3:
				this.classes += "tpa ";
				tempb += "<abbr title='3rd Party Auth'><span class='ui-icon ui-icon-signal'></span></abbr>"; //Third Party Auth
				break;
		}
		if (this.nie == true) {
			this.title += " <abbr title='Newspapers in Education'>(NIE)</abbr>";
			this.classes += "nie ";
		}
		if (this.spcrule == "1" || this.spcrule == 1 || this.spcrule == "3" || this.spcrule == 3) { //special rule #1 or #3: short URL
			this.title += " (Short)";
		}
		if (this.spcrule) {
			this.classes += "spcrule_" + this.spcrule + " ";
		}
		/*if (this.external == true) {
			this.classes += "exthost ";
		} else {
			this.classes += "olvhost ";
		}*/
		this.classes += (this.external == true) ? "exthost " : "olvhost ";
		if (this.stat != 0) { //new with 4.7, enumerated status instead of boolean "dead"
			switch(this.stat) {
			case 1:
				this.classes += "inprog "; //in progress
				tempb += "<abbr title='Under Construction'><span class='ui-icon ui-icon-wrench'></span></abbr>"; 
				break;
			case 2:
				this.classes += "dead ";
				tempb += "<abbr title='Dead'><span class='ui-icon ui-icon-cancel'></span></abbr>"; 
				break;
			case 3:
				this.classes += "inttest "; //internal test
				tempb += "<abbr title='Internal Test'><span class='ui-icon ui-icon-clipboard'></span></abbr>"; 
				break;
			default:
				break;
			}
		}
		if (ParFilter == "Olive") {
			tempa = "Skin: " + this.skin + " | Passphrase: " + this.passphrase;
			if (this.app == "ATS") tempa = "Admin Login: " + this.passphrase;
			if (this.auth == 3) tempa = "Login= " + this.passphrase; //[4.3]
		};
		if (this.repo.indexOf(",") > -1) {
			this.title += " <span class='repoid bold'><abbr title=" + this.repo + ">[" + ((this.repo.match(/,/g)||[]).length + 1) + " pubs]</abbr></span> "; //4.7.10
		} else {
			this.title += " <span class='repoid'>[" + this.repo + "]</span> ";
		}
		this.title += " <abbr title='" + tempa + "'><span class='app'>" + this.app + this.ver + "</span></abbr>";//4.6
		if (ParFilter == "Olive" && this.parent) this.title = "<span class='parentorg'>" + this.parent + "</span>: " + this.title;
		if (this.external == true) {
			this.title += "<abbr title='Not Hosted on Olive cluster'><span class='ui-icon ui-icon-suitcase'></span></abbr>";
			}
		if (this.cp != "") this.title = this.title + "<abbr title='CP Code Available'><span class='ui-icon ui-icon-extlink'></span></abbr>";
		if (this.spcrule != "") this.title += "<abbr title='Special Rule'><span class='ui-icon ui-icon-lightbulb'></span></abbr>";
		if (!this.ts) this.classes += "pretimestamp ";
		if (tempb) this.title = this.title + tempb;
		if (this.parent) {
			temp = this.parent;
			for (pd=0; pd<ParentDD.length; pd++) {
				if (ParentDD[pd] == temp) temp = "";
			}
			if (temp) ParentDD[ParentDD.length] = temp;
		}
		//Define App drop down values
		tmpapp = this.app; 
		tmpver = this.ver;
		for (ad = 1; ad < AppDD.length; ad++) {
			if (AppDD[ad] == tmpapp) {//if we've already recognized this app
				tmpapp = ""; //then temp (new app) is set to nil
				if (tmpver) {
					for (av = 1; av < ApvDD[ad].length; av++) { //already have this version?
						if (ApvDD[ad][av] == tmpver) {
							tmpver = "";
						}
					}
					if (tmpver) { //if not, add it.
						ApvDD[ad][ApvDD[ad].length] = tmpver;
						
						//sort versions
						for (i=1; i < ApvDD[ad].length; i++) {
							for (ii=i + 1; ii <= ApvDD[ad].length; ii++) {
								if (ApvDD[ad][i] < ApvDD[ad][ii]) {
									temp = ApvDD[ad][i];
									ApvDD[ad][i] = ApvDD[ad][ii];
									ApvDD[ad][ii] = temp;
								}
							}
						};
						
					}
				}
			}
		}
		if (tmpapp) { //modifed 4.6 - if temp exists, add it to list of apps
			var tmpapln = AppDD.length;
			AppDD[tmpapln] = tmpapp;
			ApvDD[tmpapln] = new Array("All"); //create array for versions
			if (tmpver) { //if version exists, apply it
				ApvDD[tmpapln][1] = tmpver;
			}			
		}
	};
	
	/*FUNCTIONS*/
	
	function Sorter() { //sorts data
		for (i=1; i <= NewLink.length; i++) {
			SLink[i] = i-1;
		};
		
		//sort records by title
		for (i=1; i < NewLink.length; i++) {
			for (ii=i + 1; ii <=NewLink.length; ii++) {
				if (NewLink[SLink[i]].title > NewLink[SLink[ii]].title) {
					temp = SLink[i];
					SLink[i] = SLink[ii];
					SLink[ii] = temp;
				}
			}
		};
		
		
		//sort apps
		for (i=1; i < AppDD.length; i++) {
			for (ii=i + 1; ii <= AppDD.length; ii++) {
				if (AppDD[i] > AppDD[ii]) {
					tempd = AppDD[i];
					AppDD[i] = AppDD[ii];
					AppDD[ii] = tempd;
					tempv = ApvDD[i];
					ApvDD[i] = ApvDD[ii];
					ApvDD[ii] = tempv;
				}
			}
		};
		
		//sort parents
		for (i=2; i < ParentDD.length; i++) {
			for (ii=i + 1; ii <= ParentDD.length; ii++) {
				if (ParentDD[i] > ParentDD[ii]) {
					temp = ParentDD[i];
					ParentDD[i] = ParentDD[ii];
					ParentDD[ii] = temp;
				}
			}
		};
		
		//Populate Filter drop downs
		for (ad = 0 ; ad < AppDD.length ; ad++) {
			appDD$.append("<option value='" + ad + "'>" + AppDD[ad] + "</option>")
		};
		for (pd = 0 ; pd < ParentDD.length ; pd++) {
			parentDD$.append("<option value='" + ParentDD[pd] + "'>" + ParentDD[pd] + "</option>")
		};
		
		PopNavFrame();
	};
	
	function PopNavFrame() {
		//Populate NavFrame NavList - mod'd in 5.1
		navList$.html("<ol></ol>"); //reset NavList
		for (tt=1; tt <= NewLink.length; tt++) { //loop through data-set
			//apply filters
			if (loading && !preload) { //if "loading" then apply no filters
				navList$.find("ol").append("<li class='" + NewLink[SLink[tt]].classes + "' id='" + SLink[tt] + "'>" + NewLink[SLink[tt]].title + "</li>");
			} else { //if not loading, then apply filters
				if (!(document.filter.textfilt.value.substr(0,1) != "-" && NewLink[SLink[tt]].title.toLowerCase().search(document.filter.textfilt.value.toLowerCase()) == -1)) {//filter by text filter field
					if (!(document.filter.textfilt.value.substr(0,1) == "-" && NewLink[SLink[tt]].title.toLowerCase().search(document.filter.textfilt.value.substr(1).toLowerCase()) != -1)) {//filter by "reverse" text filter field (if "-" starts it)
						if (!(document.filter.parentorg.value != "Any" && document.filter.parentorg.value != "None" && NewLink[SLink[tt]].parent != document.filter.parentorg.value)) {//filter by parent org
							if (!(document.filter.parentorg.value == "None" && NewLink[SLink[tt]].parent)) {
								if (!(document.filter.application.value != 0 && NewLink[SLink[tt]].app != AppDD[document.filter.application.value])) {//filter by application
									if (document.filter.application.value == 0 || document.filter.appver.value == "All" || document.filter.appver.value == NewLink[SLink[tt]].ver) {//filter by version
										navList$.find("ol").append("<li class='" + NewLink[SLink[tt]].classes + "' id='" + SLink[tt] + "'>" + NewLink[SLink[tt]].title + "</li>");
									}
								}
							}
						}
					}
				}
			}
		}
		//if no results found
		if (navList$.find("li").length == 0 && !loading) {
			navList$.find("ol").append("<li class='noresults'>No Results Found</li>");
		} else if (navList$.find("li").length == 0 && loading) {
			if (preload) {
				navList$.find("ol").append("<li class='noresults'>Loading Query String... (if no results, change filters)</li>");
			} else {
				navList$.find("ol").append("<li class='noresults'>Loading... Please wait.</li>");
			}
		}
		//Define navList event handlers
		navList$.find("li").click(function() {
			var temp = $(this).attr("id");
			GetAuthLink(temp);
		});
		MaskFilter();
	};
	
	function MaskFilter() {
		navList$.find(".hidden").removeClass("hidden"); //clear hidden
		if (document.filter.hbolive.checked == true) navList$.find(".exthost").addClass("hidden"); //hosted by Olive only checked?
		if (document.filter.hbext.checked == true) navList$.find(".olvhost").addClass("hidden"); //hosted by Non-Olive only checked?
		if (document.filter.autholive.checked == false) navList$.find(".auth").addClass("hidden");//auth?
		if (document.filter.authfree.checked == false) navList$.find(".free").addClass("hidden");//free?
		if (document.filter.authtrial.checked == false) navList$.find(".demo").addClass("hidden");//trial?
		if (document.filter.authtpa.checked == false) navList$.find(".tpa").addClass("hidden");//tpa
		if (document.filter.othernie.checked == false) navList$.find(".nie").addClass("hidden"); //nie?
		if (document.filter.otherdead.checked == false) navList$.find(".dead").addClass("hidden"); //Live only?
		//if (document.filter.otherinttest.checked == false) navList$.find(".inttest").addClass("hidden"); //Internal Test skins? [4.7]
		if (document.filter.otherinprog.checked == false) navList$.find(".inprog").addClass("hidden"); //In progress skins? [4.7]
		if (document.filter.otherprimary.checked == true) navList$.find(".nonprime").addClass("hidden"); //Primary Only [6.0]
		if (document.filter.otherwrapper.checked == true) navList$.find(".nowrap").addClass("hidden"); //has a wrapper [6.0]
		if (document.filter.ts_has.checked == true) { //sort by recent [6.0.2] 
			navList$.find(".pretimestamp").addClass("hidden");
		};
		if (navList$.find("li:visible").length == 0) {
			navList$.find("ol").append("<li class='mfnoresults'>No Results Found (perhaps adjust filters or flags)</li>");
		} else {
			navList$.find(".mfnoresults").remove();
		}
	}
	
	function GetAuthLink(x, href) { //generates auth link ; 4.4.5 ymd added for back issue date
		//console.log("GetAuthLink: " + x + ", " + href);
		var ThisLink = NewLink[x];
		var returnUnAuth = false; //used by export to display unauthenticated skin URL
		if (href == "return") {
			returnUnAuth = true;
			href = undefined;
		};
		loginurl = "";
		readerval = "";
		protocol = "http"; //6.0.3
		if (ThisLink.domain == "digital2.olivesoftware.com" || ThisLink.spcrule == "9" || ThisLink.spcrule == 9) {//6.0.3/6.0.6
			protocol = "https";
		}
		if (ThisLink.app.substring(0,3) == "ODE" || ThisLink.app == "AM4" || ThisLink.app == "AM5" || ThisLink.app == "BOOK" || ThisLink.app == "AE" || ThisLink.app == "APD5") {
			/*if (ThisLink.spcrule == 1) { //check special rule "1" (USA Today's short URL)
				SkinURL = ThisLink.skin;
			} else {
				SkinURL = "Olive/ODE/" + ThisLink.skin;
			}*/
			SkinUrl = (ThisLink.spcrule == 1) ? ThisLink.skin : "Olive/ODE" + ThisLink.skin; //check special rule "1" (USA Today's short URL)
			loginurl = SkinURL + "/Login/Login.aspx";
			readerval = "Reader=/" + SkinURL;
			if (href) {
				if (ThisLink.auth == 0) { //4.5.5 rv 4.6.15
					readerval += "?href=" + href;
				} else {
				SkinURL += "?href=" + href;
				}
			}
		} else if (ThisLink.app == "AMDD") {
			/*if (ThisLink.spcrule == 3) { //check special rule "3" (short URL)
				SkinURL = ""; //AMDD short URL uses domain only - no skin name
			} else {
				SkinURL = "Olive/AMDD/" + ThisLink.skin;
			}*/
			SkinURL = (ThisLink.spcrule == 3) ? "" : "Olive/AMDD/" + ThisLink.skin;
			loginurl = SkinURL + "/Login/Login.aspx";
			readerval = "Reader=/" + SkinURL;
		/*} else if (ThisLink.app == "OTB" || ThisLink.app == "ODN") { // For OTB and ODN (where app = VD)
			SkinURL = "Olive/" + ThisLink.app + "/" + ThisLink.skin;
			loginurl = SkinURL + "/Login/Login.aspx";
			readerval = "Reader=" + SkinURL;*/
		} else if (ThisLink.app == "OMV" || ThisLink.app == "Tablet") {
			SkinURL = "Olive/Tablet/" + ThisLink.skin;
			loginurl = SkinURL + "/AfterLogin.ashx";
			if (href) readerval = "origin=/" + SkinURL + "?href=" + href;
		} else if (ThisLink.app == "iReader") {
			SkinURL = "Olive/iReader/" + ThisLink.skin;
			loginurl = SkinURL + "/AfterLogin.ashx";
			SkinURL = SkinURL + "/library.aspx";
		} else if (ThisLink.app == "OMA" || ThisLink.app == "OTB" || ThisLink.app == "ODN" || ThisLink.app == "CET" || ThisLink.app == "CRT" || ThisLink.app == "ODB") {//4.9.3
			/*if (ThisLink.spcrule == 1) { //check special rule "1" (USA Today's short URL)
				SkinURL = ThisLink.skin;
			} else {
				SkinURL = "Olive/" + ThisLink.app + "/" + ThisLink.skin;
			}*/
			SkinURL = (ThisLink.spcrule == 1) ? ThisLink.skin : "Olive/" + ThisLink.app + "/" + ThisLink.skin;
			loginurl = SkinURL + "/AfterLogin.ashx";
			if (ThisLink.app == "ODN") { //ODN [4.7.17]
				SkinURL += "/default.aspx";
			}
		} else if (ThisLink.app == "APD" && parseInt(ThisLink.ver) < 4 ) {
			if (ThisLink.spcrule == "7") {
				SkinURL = "default/skins/" + ThisLink.skin + "/client.asp?skin=" + ThisLink.skin + "&amp;Daily=" + ThisLink.repo;
			} else {
				SkinURL = "daily/client.asp?skin=" + ThisLink.skin;
			}
			loginurl = "login/" + ThisLink.login + "/login.asp";
			readerval = "Reader=/" + SkinURL + "%26Daily=" + ThisLink.repo;
		} else if (ThisLink.app == "ATS") {
			if (ThisLink.spcrule == "6") {
				SkinURL = "Projects/ETS/Default/login.asp?AppName=ETS&ProjId=" + ThisLink.skin;
			} else {
				SkinURL = "Projects/ETS/" + ThisLink.skin + "/login.asp?AppName=ETS&ProjId=" + ThisLink.skin;
			}
		} else if (ThisLink.app == "AdL" || ThisLink.app == "ADL") {
			SkinURL = "adl/adlauncher.asp?skin=" + ThisLink.skin;
		} else if (ThisLink.app == "Feed") {
			switch (parseInt(ThisLink.spcrule)) {
				case 2: //check special rule "2" (Hearst Email feed vs standard Kindle feed)
					SkinURL = ThisLink.parent + "/feeds/" + ThisLink.skin + "/manifest.xml";
					break;
				case 4: //check special rule "4" (Kindle feed in repository)
					var spcs4 = document.filter.newdate.value.split("-");
					SkinURL = "repository/" + ThisLink.repo + "/" + spcs4[0] + "/" + spcs4[1] + "/" + spcs4[2] + "/res/channels/kindlefeed/manifest.xml";
					break;
				default:
					SkinURL = "kindlefeed/" + ThisLink.skin + "/manifest.xml";
			}
		} else if (ThisLink.app == "APA" && parseInt(ThisLink.ver) >= 5) { //APA5
			SkinURL = "Olive/" + ThisLink.app + "/" + ThisLink.skin;
			loginurl = SkinURL + "/AfterLogin.ashx";
			SkinURL += "/default.aspx"; //4.8.3
		} else if (ThisLink.app == "APA" && ThisLink.spcrule == 8) { //Time Traveler 5.1.11
			SkinURL = "Olive/" + ThisLink.app + "/" + ThisLink.skin;
			loginurl = SkinURL + "/AfterLogin.ashx";
			SkinURL += "/defaultTT.aspx?BaseHref=" + ThisLink.repo + "/" + (yyyy - 50) + "/" + mm + "/" + dd + "&href=" + ThisLink.repo + "/" + (yyyy - 50) + "/" + mm + "/" + dd;
		} else { //APA2 or 3
			SkinURL = "default/client.asp?skin=" + ThisLink.skin;
			loginurl = "login/" + ThisLink.login + "/login.asp";
			readerval = "Reader=/" + SkinURL;
			if (ThisLink.external) readerval += "%26enter=true";
		};
		
		//Olive authenticating skin?
		if (ThisLink.auth == 0) {
			//build MD5 Hash
			var temp = "" + userid + date;
			if (ThisLink.restrictions == true) {
				temp = temp + rvalue;
			};
			temp = temp + ThisLink.passphrase;
			var hash = hex_md5(temp);
			
			AuthURL = "/" + loginurl;
			if (readerval != "") { //?Reader= parameter defined, appended "&"
				readerval += "&"; 
			}
			readerval = "?" + readerval; //prepend "?"
			readerval += "Id=" + userid + "&d=" + date; //append "Id" & "d"
			if (ThisLink.restrictions == true) { //if restrictions, append "r"
				readerval += "&r=" + rvalue;
			};
			readerval += "&c=" + hash; //append "c"
			AuthURL += readerval; //append readerval to AuthURL			
		} else {
			AuthURL = "/" + SkinURL;
		}
				
		if (returnUnAuth == true) { //5.1.0
			href = "return";
		}
		
		if (href == undefined) {
			WriteAuthLink(x, SkinURL, AuthURL, protocol);
		} else if (href == "return") { //5.1.0
			return(protocol + "://" + ThisLink.domain + "/" + SkinURL);
		} else {
			return(protocol + "://" + ThisLink.domain + "/" + AuthURL);
		}
	};
		
		
	function WriteAuthLink(x, SkinURL, AuthURL, protocol) {
		/*Write results*/
		//console.log("x: " + x + "; SkinURL: " + SkinURL + "; AuthURL: " + AuthURL);
		var ThisLink = NewLink[x];
		var tmpnote;
		var authbuttonenabled; //4.9
		var TempURL; //4.9
		
		dispFrame$.find("#entry_" + x).remove();
		dispFrame$.append("<div id='entry_" + x + "' class='entry'><span class='closer' id='close_" + x + "'></span></div>");
		dispFrame$.find("#entry_" + x).append("<h1 class='ui-widget-header'><span id='sitesum_"+x+"'>" + ThisLink.title + "</span></h1>");
		
		dispFrame$.find("#close_" + x).click(function() {
			dispFrame$.find("#entry_" + x).fadeOut();
		});
		
		if (ParFilter == "Olive" || ParFilter == "Tribune") { //4.6.18
			dispFrame$.find("#sitesum_" + x).click(function() { //4.6.2
				OpenSiteSummary(x, SkinURL, AuthURL);
			});
		};
		
		tmpnote = "";
		if (ThisLink.auth == 3 && ThisLink.passphrase != "") {
			tmpnote = "<small> [Login=" + ThisLink.passphrase + "]</small>";
		}
		TempURL = AuthURL;
		if (ThisLink.auth == 0 && authpreference == "SHOW") { //4.9
			TempURL = "/" + SkinURL; 
		}
		dispFrame$.find("#entry_" + x).append("<a id='a_entry_" + x + "' class='link_text' href='" + protocol + "://" + ThisLink.domain + TempURL + "' target='_blank'>" + protocol + "://" + ThisLink.domain + TempURL + "</a>" + tmpnote);
		if (ThisLink.auth == 0) { //4.9
			dispFrame$.find("#entry_" + x).append("<button id='entry_authbutt_" + x + "' class='link_auth_butt' mode='" + authpreference + "'>" + authpreference + " Auth</button>");
			dispFrame$.find("#entry_authbutt_" + x).button().click(function() {
				ToggleAuth(x, SkinURL, AuthURL);
			});
			
		};
		//buttons
		dispFrame$.find("#entry_" + x).append("<p class='clear'></p><div id='linkbutt_" + x + "' class='linkbuttset floatleft'></div>");
		/*if (ThisLink.auth == 0) { //removed 4.9
			dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt' href='http://" + ThisLink.domain + "/" + SkinURL + "' target='_blank'><abbr title='Un-authenticated'>Source</abbr></a>");
		}*/
		if (ParFilter == "Olive" && !ThisLink.external && ThisLink.spcrule != 3) {
			if (!(ThisLink.domain == "digital.olivesoftware.com" || ThisLink.domain == "demo.olivesoftware.com" || (ThisLink.domain == "staging.olivesoftware.com" && ThisLink.stat != 2))) {//ammended 4.7.4
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt digbutt' href='http://digital.olivesoftware.com" + TempURL + "' target='_blank'>Digital</a>");
			}
			/*if (ThisLink.domain != "demo.olivesoftware.com" && ThisLink.domain != "staging.olivesoftware.com") {
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt d86butt' href='http://208.42.237.86" + TempURL + "' target='_blank'><abbr title='Non-cached'>DVR-86</abbr></a>");
			}*/
		
			//Back Issue 4.4.5
			if (ThisLink.app.substr(0,3) == "ODE" || ThisLink.app == "OMV") {
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt' id='bi_" + x + "'><abbr title='Open Back Issue'>Back</abbr></a>");
				dispFrame$.find("#bi_" + x).button().click(function() {
					openBackIssue(x);
				});
			}
		
			//iReader Test Links 4.5.1 //Changed to general test link 4.8.1
			//if (ThisLink.app == "iReader") {
			if ((ThisLink.stat == 0 ) && !ThisLink.external) {
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt' id='iRt_" + x + "'><abbr title='Test Links'>Test</abbr></a>");
				dispFrame$.find("#iRt_" + x).button().click(function() {
					openRepoTest(x); //changed in 4.8.1
				});
			}
			
			if (!(ThisLink.domain == "demo.olivesoftware.com" || (ThisLink.domain == "staging.olivesoftware.com" && ThisLink.stat != 1))) { //ammended 4.7.4
				for (i=0; i < Serv64.length; i++) {
					dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt "+ Serv64id[i] + "butt' href='http://" + Serv64[i] + TempURL + "' target='_blank'><abbr title=" + Serv64[i].toUpperCase() + ">" + Serv64id[i] + "</abbr></a>");
				}
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt' id='openall_64_" + x + "' target='_blank'><abbr title='Opens site on all live 64-bit servers'>All Live</abbr></a>");
				//dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt sbbutt' href='http://sb.olivesoftware.com" + TempURL + "' target='_blank'><abbr title='NOTE: " + ThisLink.skin + " May Not Be Available in Sandbox (Cached) Environment'>SB</abbr></a>"); 5.2.3
				if (ThisLink.stat != 1) {//4.7.4
					dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt awssbutt' href='http://staging.olivesoftware.com" + TempURL + "' target='_blank'><abbr title='NOTE: " + ThisLink.skin + " May Not Be Available in Sample Environment'>STAGE</abbr></a><a class='linkbutt qasbutt' href='http://test.olivesoftware.com" + TempURL + "' target='_blank'><abbr title='NOTE: " + ThisLink.skin + " May Not Be Available in QA Server Environment'>QA Server</abbr></a>");
				}
				/*if (ThisLink.app == "OTB" || ThisLink.app == "CET" || ThisLink.app == "CRT" ) {//4.7.16 //4.9.4
					dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt 82butt' href='http://208.42.237.82" + AuthURL + "' target='_blank'><abbr title='NOTE: " + ThisLink.skin + " May Not Be Available in Sample Environment'>82</abbr></a>");
				}*/
				if ((ThisLink.app == "ODN" || (ThisLink.app == "APA" && ThisLink.ver > 5) || ThisLink.app == "ATS") && ThisLink.stat < 2) {//5.1.7
					if (ThisLink.stat < 1) {//5.1.7
						dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt awsbutt' href='http://digitalaws.olivesoftware.com" + TempURL + "' target='_blank'><abbr title='AWS'>AWS</abbr></a>");
						//dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt aws1butt' href='http://35.160.194.231" + TempURL + "' target='_blank'><abbr title='AWS ZONE1-APPSRVR1'>APPSRVR1</abbr></a>");
					}
					//dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt sampbutt' href='http://sample.olivesoftware.com" + TempURL + "' target='_blank'><abbr title='DVR STAGING'>DVR-Sample</abbr></a>");
				}
			}
			
			/*if (ThisLink.app == "CET") {//5.1.8 //5.1.9
				dispFrame$.find("#linkbutt_" + x).append("<a class='linkbutt 82butt' href='http://connect.olivesoftware.com" + AuthURL + "' target='_blank'><abbr title='NOTE: " + ThisLink.skin + " May Not Be Available in AWS PSServer'>AWS-PSS</abbr></a>");
			}*/
		}
				
		dispFrame$.find(".linkbutt").button();
		/*dispFrame$.find("#openall_32_" + x).click(function() {
			openAll(ThisLink.skin, ThisLink.app, AuthURL, 0);
		});*/
		dispFrame$.find("#openall_64_" + x).click(function() {
			openAll(x, SkinURL, AuthURL);//mod 4.9
		});
		$("#linkbutt_" + x).buttonset();
		
		//special function buttons
		if (!((ThisLink.external && ThisLink.spcrule != 5) || ThisLink.app == "Feed" || ParFilter != "Olive")) { //edited 4.6.17
			dispFrame$.find("#entry_" + x).append("<div class='floatright functbuttset' id='functbutt_" + x + "'></div>");
			
			//indexer
			dispFrame$.find("#functbutt_" + x).append("<a class='processer' id='ind_" + x + "'>INDEX</a>");
			dispFrame$.find("#ind_" + x).button();
			
			//clear Akamai cache
			if (!ThisLink.external && ThisLink.stat == 0 && ThisLink.auth != 2 && (ThisLink.app == "ODE" || ThisLink.app == "OMV" || ThisLink.app == "iReader" || ThisLink.app == "ODN")) { //edited 4.9.2
				dispFrame$.find("#functbutt_" + x).append("<a class='processer' id='akc_" + x + "'>CLEAR CACHE</a>");
				dispFrame$.find("#akc_" + x).button();
			};
			
			//ADL Processor
			if (ThisLink.app.substr(0,3) == "ADL") {
				dispFrame$.find("#functbutt_" + x).append("<a class='processer' id='adlp_" + x + "'><abbr title='ADL Process; NOTE: May not work for all ADL skins'>ADL PROC</abbr></a>");
				dispFrame$.find("#adlp_" + x).button();
			};
			
			dispFrame$.find("#ind_" + x).click(function() {
				//edited 4.6.17 [start]
				var Temp = IdxSvr;
				if (ThisLink.spcrule == 5) {
					Temp = ThisLink.domain;
				};
				//edited 4.6.17 [end]
				indexPub(ThisLink.repo, ThisLink.app, Temp); //edited 4.6.17
			});
			
			dispFrame$.find("#akc_" + x).click(function() {
				clearAkamai(ThisLink.domain, ThisLink.skin, ThisLink.repo, ThisLink.app , ThisLink.cp) //edited 4.10
			});
			
			dispFrame$.find("#adlp_" + x).click(function() {
				adlProc(ThisLink.skin, ThisLink.login)
			});
			
			$("#functbutt_" + x).buttonset();
		}
	};
	
	/*Apply Filter*/
		
	filtButt$.click(function() {
		if (loading == true) loading = false;
		//console.log("Apply Filter button pressed.");
		applyFilter();
	});
	
	document.onkeypress = keyhandler;
	
	function keyhandler(e) {
		if (document.layers) {
			Key = e.which;
		} else {
			Key = window.event.keyCode;
		}
		if (Key == 13) {
			if (loading == true) loading = false;
			//console.log("Carriage Return hit.");
			applyFilter();
		};
	}
			
	form$.find(".immediateapply").change(function() {
		if (loading == true) loading = false;
		//console.log("Immediate Apply field changed");
		applyFilter();
	});
	
	form$.find(".immediateapplyapp").change(function() {
		if (loading == true) loading = false;
		applyAppFilter();	
	});
	
	resetButt$.click(function() {
		if (loading == false) loading = true;
		restoreFilter();
	});
	
	refButt$.click(function() {
		refreshButton();
	});
	
	form$.find("#rndauthid").click(function() {
		userid = ParFilter + "QA" + Math.floor(Math.random() * 10000);
		document.filter.authid.value = userid;
	});
	
	form$.find("#spflags").change(function() {
		MaskFilter();
	})
	
	function applyFilter() {
		//console.log("Filter Applied");
		userid = document.filter.authid.value;
		date = document.filter.newdate.value;
		//dispFrame$.find("#goodfordate").html("Good for " + date + " (UTC)");
		rvalue = document.filter.rvalue.value;
		navList$.empty();
		PopNavFrame();
	};
	
	function applyAppFilter() {//new with 4.6
		var tempapp = document.filter.application.value;
		apvDD$.find("#appver").empty();
		for (av = 0 ; av < ApvDD[tempapp].length ; av++) {
			apvDD$.find("#appver").append("<option value='" + ApvDD[tempapp][av] + "'>" + ApvDD[tempapp][av] + "</option>")
		}	
		if (ApvDD[tempapp].length > 1) {
			apvDD$.removeClass("hidden");
		} else {
			apvDD$.addClass("hidden");
			applyFilter();	
		}		
	};
	
	function restoreFilter() {
		userid = ParFilter + "QA";
		document.filter.authid.value = userid;
		GetTheDate();
		document.filter.textfilt.value = "";
		document.filter.parentorg.value = "Any";
		document.filter.application.value = 0;
		document.filter.appver.value = "All";//4.6
		document.filter.hbany.checked = true;
		document.filter.autholive.checked = true;
		document.filter.authfree.checked = true;
		document.filter.authtrial.checked = true;
		document.filter.authtpa.checked = true;
		document.filter.othernie.checked = true;
		document.filter.otherdead.checked = false;
		document.filter.otherprimary.checked = false; //6.0.4
		document.filter.otherwrapper.checked = false; //6.0.4
		//document.filter.otherinttest.checked = true; //4.9.5
		document.filter.otherinprog.checked = true; //4.9.5
		document.filter.ts_has.checked = false; //6.0.2
		document.filter.rvalue.value = "none";
		apvDD$.addClass("hidden");//4,6
		navList$.empty();
		PopNavFrame();
	};
	
	function refreshButton() {
		GetTheDate();
		dispFrame$.find(".entry").remove();
		setNavFrame();
	}
	
	/*Special Functions (3.5)*/
	
	function indexPub(pub, app, idsv) { //edited 4.6.17
		//set indexer window calendar
		var tempdate = document.filter.newdate.value.split("-");
		document.processform.processdate.value = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
		
		processer$.find("#processtext").empty();
		indexLink(pub, app, document.processform.processdate.value, idsv, false);//edited 4.6.17
		
		processer$.find("#processform").change(function() {
			processer$.find("#processtext").empty();
			indexLink(pub, app, document.processform.processdate.value, idsv, false);//edited 4.6.17
		});
		
		processer$.dialog("open");
		processer$.find("#processAll").unbind("click").click(function() {
			//processer$.find("#processtext").empty();
			//indexLink(pub, app, document.processform.processdate.value, idsv, true);//edited 4.6.17
			ProcessAllLinks(); //4.8.0
		});
	};
	
	function indexLink(pub, app, tempdate, idsv, ia) {	//edited 4.6.17
		var pubs, indmode;
		var tmppub = pub;
		if (tmppub.length > 30) tmppub = "<abbr title='" + pub + "'>" + pub.substr(0,25) + "...</abbr>";
		var temp = "INDEX | Repo: " + tmppub + " | Date: " + document.processform.processdate.value;
		processer$.dialog("option", "title", temp);
		processer$.find(".processTitle").text("Index");
				
		var indxurl = "http://" + idsv + "/APRIA/Indexer.asp?Action=Insert&RegisterOnly=false&Mode="; //edited 4.6.17
		if (app.substr(0,3) == "APD") {
			indmode = "DAILY";
		} else if (app.substr(0,3) == "APA") {
			indmode = "ARCHIVE";
		} else if (app == "ADL") {
			indmode = "ADL";
		} else if (app == "ATS") {
			indmode = "ETS";
		} else if (app == "OTB") {
			indmode = "OTB";
		/*} else if (app == "ODN") { //4.7.14 //removed in 4.7.15
			indmode = "ODN";*/
		} else {
			indmode = "OLIVE-DIGITAL-EDITION";
		}
		pubs = pub.split(",");
		//console.log(pubs.length);
		for (i = 0; i < pubs.length; i++) {		
			processer$.find("#processtext").append("<li><div class='indexopt'><a href='" + indxurl + indmode + "&Ref=" + pubs[i] + "/" + tempdate + "' target='_blank'>Index Repository <b>" + pubs[i] + "</b> (Mode: <b>" + indmode + "</b>) for <b>" + tempdate + "</b></a></li>");
			/*if (ia == true) {  //4.8.0
				window.open(indxurl + indmode + "&Ref=" + pubs[i] + "/" + tempdate);
			};*/
		};
		
	};
	
	function clearAkamai(fqdn, skn, pub, app, tcp){
		//console.log("fqdn = " + fqdn + ", skn = " + skn + ", pub = " + pub + ", app = " + app);
		//set akclearer window calendar
		var cp;
		if (tcp != "") {
			cp = tcp;
		} else if (app == "iReader" || app == "OMV" || app == "ODN") { //v5.0.5
			//console.log("No native CP, App is " + app + "; default CP is " + dCP[app]);
			cp = dCP[app];
		};
		var tempdate = document.filter.newdate.value.split("-");
		document.processform.processdate.value = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
				
		processer$.find("#processtext").empty();
		akclearLink(fqdn, skn, pub, app, false);
					
		processer$.find("#processform").change(function() {
			processer$.find("#processtext").empty();
			akclearLink(fqdn, skn, pub, app, false);
		});
		
		processer$.dialog("open");
		processer$.find("#processAll").unbind("click").click(function() {
			//processer$.find("#processtext").empty(); 4.8.0
			//akclearLink(fqdn, skn, pub, app, true);
			ProcessAllLinks(); //4.8.0
		});
		processer$.find("#processSpecial").removeClass("visible");
		if (cp) {
			processer$.find(".processSpecial").text("Clear CP " + cp);
			processer$.find("#processSpecial").addClass("visible").unbind("click").click(function() {
				akclearCP(cp);
				processer$.find("#processSpecial.visible").removeClass("visible");
				processer$.dialog("close");
			});
		}
	};
	
	function akclearLink(fqdn, skn, pub, app, ia) { /*New with 4.3.5*/	
		var pubs;
		var tempdate = document.processform.processdate.value;
		var tmppub = pub;
		if (tmppub.length > 30) tmppub = "<abbr title='" + pub + "'>" + pub.substr(0,25) + "...</abbr>";
		var temp = "CLEAR AKAMAI CACHE | Repo: " + tmppub + " | Skin: " + skn + " | " + tempdate;
		processer$.dialog("option", "title", temp);
		processer$.find(".processTitle").text("Clear");
		
		var clakurla = "http://connect.olivesoftware.com/SkinBuilderPlus/ClearAkamai.ashx?domain="; //4.9.8
		
		pubs = pub.split(",");
		processer$.find("#processtext").empty();
		for (i = 0; i < pubs.length; i++) {
			if (app.substr(0,3) == "OMV") {
				app = "Tablet"
			} //if QAA app value doesn't equal the cache clearing URL value, mod it here; otherwise, use QAA value; 4.9.2
			/*else if (app.substr(0,3) == "ODE") { 
				app = "ODE"
			} else if (app == "iReader") {
				app = "iReader"
			} else if (app == "ODN") {
				app = "ODN"
			} else {
				app = "na"
			}*/
			var clakurlb = "&path=Olive/" + app + "/" + skn + "&href=" + pubs[i] + "/" + tempdate;
			processer$.find("#processtext").append("<li><a href='" + clakurla + fqdn + clakurlb + "' target='_blank'>Clear Akamai for Repo: <b>" + pubs[i] + "</b> (Skin: <b>" + skn + "</b> &amp; Domain: <b>" + fqdn.toUpperCase() + "</b>)</a></li>");
			/*if (ia == true) {  //4.8.0
				window.open(clakurla + fqdn + clakurlb);
				//console.log(clakurla + fqdn + clakurlb);
			}*/
			if (fqdn != "digital.olivesoftware.com") {
				processer$.find("#processtext").append("<ul><li><a href='" + clakurla + "digital.olivesoftware.com" + clakurlb + "' target='_blank'>Clear Akamai for Repository: <b>" + pubs[i] + "</b> (Skin: <b>" + skn + "</b> &amp; Domain: <b>digital.olivesoftware.com</b></a></li></ul>");
				/*if (ia == true) {
					window.open(clakurla + "digital.olivesoftware.com" + clakurlb);
				}*/
			}
			//processer$.find("#processtext").append("<ul><li><a href='" + clakurla + "sb.olivesoftware.com" + clakurlb + "' target='_blank'>Clear Akamai for Repository: <b>" + pubs[i] + "</b> (Skin: <b>" + skn + "</b> &amp; Domain: <b>sb.olivesoftware.com</b></a></li></ul>");
			/*if (ia == true) {
				window.open(clakurla + "sb.olivesoftware.com" + clakurlb);
			}*/
		};
		
	};
	
	function akclearCP(cp) { //4.10.1
		window.open("http://connect.olivesoftware.com/SkinBuilderPlus/ClearAkamai?cp=" + cp);
	}
	
	function adlProc(skn, lgn){
		//set akclearer window calendar
		var tempdate = document.filter.newdate.value.split("-");
		document.processform.processdate.value = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
		
		var adlkb = skn;
		if (lgn) adlkb = lgn;
				
		processer$.find("#processtext").empty();
		adlProcLink(adlkb, false);
					
		processer$.find("#processform").change(function() {
			processer$.find("#processtext").empty();
			adlProcLink(adlkb, false);
		});
		
		processer$.dialog("open");
		processer$.find("#processAll").unbind("click").click(function() {
			//processer$.find("#processtext").empty();
			//adlProcLink(adlkb, true);
			ProcessAllLinks(); //4.8.0
		});
	};
	
	function adlProcLink(adlkb, ia) { /*New with 4.4.0*/	
		//console.log(document.processform.processdate.value);
		var tempdate = document.processform.processdate.value.split("/");
		var adldate = tempdate[2] + "/" + tempdate[1] + "/" + tempdate[0];
		//console.log(adldate);
		var temp = "ADL PROCESS | Knowledge Base: " + adlkb + " | Date: " + document.processform.processdate.value;
		processer$.dialog("option", "title", temp);
		processer$.find(".processTitle").text("Process");
		processer$.find("#processtext").empty();
				
		var clakurla = "http://zone1-staging1/Director/executor.asp?Action=Execute&Timeout=1600&paramStr=C%3A%5COlive%5CApplications%5CUtils%5CADLProcedure%5CADL.cmd%20C%3A%5COlive%5CApplications%5CUtils%5CADLProcedure%20%20-KBName%20";
		var clakurlb = "%20-From%20" + adldate + "%20-To%20" + adldate + "%20-IndexIssues%20true%20";
		processer$.find("#processtext").append("<li><a href='" + clakurla + adlkb + clakurlb + "' target='_blank'>ADL Process for <b>" + adlkb + "</b> (with indexing)</a> or <a href='" + clakurla + adlkb + clakurlb.replace('true','false') + "' target='_blank'>(without indexing)</a></li>");
		/*if (ia == true) { //4.8.0
			window.open(clakurla + adlkb + clakurlb);
		}*/
	};
	
	function openBackIssue(x) {
		//set akclearer window calendar
		var tempdate = document.filter.newdate.value.split("-");
		document.processform.processdate.value = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
			
		processer$.find("#processtext").empty();
				
		openBackIssueLink(x, false);
					
		processer$.find("#processform").change(function() {
			processer$.find("#processtext").empty();
			openBackIssueLink(x, false);
		});
		
		processer$.dialog("open");
		processer$.find("#processAll").unbind("click").click(function() {
			//openBackIssueLink(x, true); //4.8.0
			ProcessAllLinks();
		});
	}
	
	function openBackIssueLink(x, ia) {
		var tempdate = document.processform.processdate.value.split("/");
		var templink = NewLink[x]
		var backdate = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
		var temp = "OPEN BACK ISSUE | Skin: " + templink.skin + " | Date: " + backdate;
		processer$.dialog("option", "title", temp);
		processer$.find(".processTitle").text("Open");
		processer$.find("#processtext").empty();
		
		pubs = NewLink[x].repo.split("/");
		for (i = 0; i < pubs.length; i++) {	
			var backlink = GetAuthLink(x, pubs[i] + "/" + backdate);
			/*if (ia) { //4.8.0
				//window.open(backlink);
			} else {*/
			processer$.find("#processtext").append("<li><a href='" + backlink + "' target='_blank'>Open <b>" + pubs[i] + "/" + backdate + "</b> in " + templink.skin + " (" + templink.app + ") skin</a></li>");
			//}
		};
	}
	
	function openRepoTest(x) { //4.8.1 was openRepoTest
		var tempdate = document.filter.newdate.value.split("-");
		document.processform.processdate.value = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
			
		processer$.find("#processtext").empty();
				
		openRepoTestLink(x);
					
		processer$.find("#processform").change(function() {
			processer$.find("#processtext").empty();
			openRepoTestLink(x);
		});
		
		processer$.dialog("open");
		processer$.find("#processAll").unbind("click").click(function() {
			//openRepoTestLink(x, true);
			ProcessAllLinks(); //4.8.0
		});
				
	}
	
	function openRepoTestLink(x) {
		var tempdate = document.processform.processdate.value.split("/");
		var templink = NewLink[x]
		var backdate = tempdate[0] + "/" + tempdate[1] + "/" + tempdate[2];
		var temp = "REPO TEST LINKS | Skin: " + templink.skin + " | HREF: " + templink.repo + "/" + backdate;
		processer$.dialog("option", "title", temp);
		processer$.find(".processTitle").text("Open");
		
		processer$.find("#processtext").empty(); //4.9.1
		var tmprepoarray = templink.repo.split(","); //4.9.1
		for (var i = 0; i < tmprepoarray.length; i++ ) {//4.9.1
			processer$.find("#processtext").append("<li><a href='http://staging.olivesoftware.com/WebPortal/Default.aspx?href=" + tmprepoarray[i] + "/" + backdate + "' target='_blank'>All Repository Files Present for " + tmprepoarray[i] + "/" + backdate + "?</a></li>");
		};		
		
		if (templink.app == "iReader") {
			var testFQDN = new Array("ireader.olivesoftware.com", "zone1-appsrvr1");
			var testPath = "/Olive/iReader/" + templink.skin + "/";
			var testURL = new Array("DataService.svc/ListDocuments", "DataService.svc/GetDescriptor/?$DOC", "ViewArticle.aspx?$DOC&$ART", "sharedarticle.ashx?$DOC&$ART");
			for (var i = 0; i < testURL.length; i ++) {
				testURL[i] = testURL[i].replace("$DOC", "document=" + templink.repo + "/" + backdate);
				testURL[i] = testURL[i].replace("$ART", "Article=Ar00100");
			};
			
			for (i = 0; i < testURL.length; i++ ) {
				for (ii = 0; ii < testFQDN.length; ii++ ) {
					processer$.find("#processtext").append("<li><a href='http://" + testFQDN[ii] + testPath + testURL[i] + "' target='_blank'>" + testFQDN[ii] + testPath + testURL[i] + "</a></li>");
					/*if (ia) { //4.8.0
						window.open("http://" + testFQDN[ii] + testPath + testURL[i]);
					}*/
				}
			}
		} else if (templink.app == "ODE") { //5.1.1; Skin Settings for ODE
			processer$.find("#processtext").append("<li><a href='http://" + templink.domain + "/Olive/ODE/" + templink.skin + "/server/GetContent.asp?type=Settings&for=Application' target='_blank'>ODE Skin Settings</a></li>")
		} else if (templink.app == "APA" && templink.ver < 5) { //5.1.1; Skin Settings for APA3
			processer$.find("#processtext").append("<li><a href='http://" + templink.domain + "/Default/Skins/" + templink.skin + "/HCSkinSettings.xml' target='_blank'>APA" + templink.ver + " Skin Settings</a></li>")
		} else if (templink.app == "ODN") { //6.0.5; Latest editions for ODN
			processer$.find("#processtext").append("<li><a href='http://" + templink.domain + "/Olive/ODN/" + templink.skin + "/get/browse.ashx?kind=recent' target='_blank'>Editions available to " + templink.skin + " ODN skin</a></li>")
		}  
	}
	
	function openAll(x, SkinURL, AuthURL) {
		var TempURL = AuthURL;
		confirm$.find("#conftext").html("<p>This will open the <b>" + NewLink[x].skin + " " + NewLink[x].app + "</b> skin on all live 64-bit load-balanced servers at once!<br/>This may cause browser instability. Proceed with caution.</p>")
		confirm$.dialog({
			title: "Open " + NewLink[x].skin + " on all Servers?",
			buttons: {
				"Confirm": function() {
					if (dispFrame$.find("#entry_authbutt_" + x).attr("mode") == "SHOW") {
						TempURL = "/" + SkinURL;
					};
					for (i=0; i < Serv64.length; i++) {
						window.open("http://" + Serv64[i] + TempURL);
					};
					$(this).dialog("close");
				}, 
				Cancel: function() {
					$(this).dialog("close");
				}
			}
		})
		confirm$.dialog("open");
	};
	
	function OpenSiteSummary(x, SkinURL, AuthURL) {
		var SSLink = NewLink[x];
		var SS = "";
		sitesumm$.dialog({
			title: SSLink.title
		})
		sitesumm$.find("#sitesummarytext").empty().append("<iframe id='sitesum' height='95%' width='100%' frameborder='0'></iframe>");
		var iData = document.getElementById('sitesum');
		iData = (iData.contentWindow) ? iData.contentWindow : (iData.contentDocument.document);
		SS += "<h3>" + SSLink.publication + "</h3>";
		SS += "<p>" + SSLink.app + " Skin URL: http://" + SSLink.domain + "/" + SkinURL + "</p>";
		SS += "<p>Redirection URL: </p>";
		SS += "<p>Secret Passphrase: " + SSLink.passphrase + "</p>";
		SS += "<p>Sample Authenticating URL: http://" + SSLink.domain + AuthURL + "</p>";
		SS += "<p>Repository ID(s): " + SSLink.repo + "</p>"; //4.7.10
		if (SSLink.cp) {
			SS += "<p>CP Code: " + SSLink.cp + "</p>"; //4.7.10
		};
		if (!SSLink.ts) {
			SS += "<p>Record last saved <span>prior to timestamps being recorded</span>.</p>";
		} else {
			SS += "<p>Record last saved <span>on " + SSLink.ts.replace(","," at ") + "</span>.</p>";
		};
		iData.document.write(SS);
	
		sitesumm$.dialog("open");
	}
	
	/*Help*/
	
	help$.dialog({
		autoOpen: false,
		closeOnEscape: true,
		modal: true,
		width: "80%",
		title: "Help"
	});
	
	helpButt$.click(function() {
		help$.dialog("open");
	});
	
	reloadButt$.click(function() {
		loadJSONData();
	});
	
	expButt$.click(function() { //5.1.0
		exportList();
	});
	
	/*Check Query String filters - 4.7.11*/
	$.urlParam = function(name, url) {
		if (!url) {
		 url = window.location.href;
		}
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
		if (!results) { 
			return 0; 
		}
		return results[1] || 0;
	}
	
	function CheckQueryStrings() {
		if ($.urlParam("q") != 0) {
			//console.log($.urlParam("q"));
			preload = true;
			var querystring = unescape($.urlParam("q"));
			document.filter.textfilt.value = querystring;
		}
	};
	
	function ProcessAllLinks() {
		/*ar x = processer$.find("#processtext a").length;
		console.log ("Number of Links under Process Text: " + x);*/
		processer$.find("#processtext a").each(function(idx) {
			//console.log("Link " + idx + " is " + $(this).attr('href'));
			window.open($(this).attr('href'));
		});
		
	}
	
	function ToggleAuth(x, SkinURL, AuthURL) { //4.9
		/*IDEA FOR 4.9:
		Button toggles on or off authentication. State is remembered for next link.
		When auth is enabled, authenticating URL is used for main link as well as buttons (other servers)
		When auth is disabled, source URL is used for main link as well as buttons
		*/
		var mode = dispFrame$.find("#entry_authbutt_" + x).attr("mode");
		
		console.log("TA: x: " + x + "; SkinURL: " + SkinURL + "; AuthURL: " + AuthURL + "; MODE: " + mode);
		if (mode == "SHOW") {
			dispFrame$.find("#entry_authbutt_" + x).attr("mode", "HIDE");
			authpreference = "HIDE";
			console.log("TA: x: " + x + "; SkinURL: " + SkinURL + "; AuthURL: " + AuthURL + "; MODE: " + mode);
			dispFrame$.find("#a_entry_" + x).attr("href", "http://" + NewLink[x].domain + AuthURL).text("http://" + NewLink[x].domain + AuthURL);
			dispFrame$.find("#linkbutt_" + x + " .digbutt").attr("href", "http://digital.olivesoftware.com" + AuthURL);
			//dispFrame$.find("#linkbutt_" + x + " .d86butt").attr("href", "http://208.42.237.86" + AuthURL);
			for (i=0; i < Serv64.length; i++) {
					dispFrame$.find("#linkbutt_" + x + " ." + Serv64id[i] + "butt").attr("href", "http://" + Serv64[i] + AuthURL);
				};
			//dispFrame$.find("#linkbutt_" + x + " .sbbutt").attr("href", "http://sb.olivesoftware.com" + AuthURL);
			//dispFrame$.find("#linkbutt_" + x + " .sampbutt").attr("href", "http://sample.olivesoftware.com" + AuthURL);
			dispFrame$.find("#linkbutt_" + x + " .awssbutt").attr("href", "http://staging.olivesoftware.com" + AuthURL);
			dispFrame$.find("#linkbutt_" + x + " .qasbutt").attr("href", "http://test.olivesoftware.com" + AuthURL);
			dispFrame$.find("#linkbutt_" + x + " .awsbutt").attr("href", "http://digitalaws.olivesoftware.com" + AuthURL);
			//dispFrame$.find("#linkbutt_" + x + " .aws1butt").attr("href", "http://35.160.194.231" + AuthURL);
		} else {
			dispFrame$.find("#entry_authbutt_" + x).attr("mode", "SHOW");
			authpreference = "SHOW";
			dispFrame$.find("#a_entry_" + x).attr("href", "http://" + NewLink[x].domain + "/" + SkinURL).text("http://" + NewLink[x].domain + "/" + SkinURL);
			dispFrame$.find("#linkbutt_" + x + " .digbutt").attr("href", "http://digital.olivesoftware.com/" + SkinURL);
			//dispFrame$.find("#linkbutt_" + x + " .d86butt").attr("href", "http://208.42.237.86/" + SkinURL);
			for (i=0; i < Serv64.length; i++) {
					dispFrame$.find("#linkbutt_" + x + " ." + Serv64id[i] + "butt").attr("href", "http://" + Serv64[i] + "/" + SkinURL);
				};
			//dispFrame$.find("#linkbutt_" + x + " .sbbutt").attr("href", "http://sb.olivesoftware.com/" + SkinURL);
			dispFrame$.find("#linkbutt_" + x + " .awssbutt").attr("href", "http://staging.olivesoftware.com/" + SkinURL);
			dispFrame$.find("#linkbutt_" + x + " .qasbutt").attr("href", "http://test.olivesoftware.com/" + SkinURL);
			dispFrame$.find("#linkbutt_" + x + " .awsbutt").attr("href", "http://digitalaws.olivesoftware.com/" + SkinURL);
			//dispFrame$.find("#linkbutt_" + x + " .aws1butt").attr("href", "http://35.160.194.231/" + SkinURL);
			//dispFrame$.find("#linkbutt_" + x + " .sampbutt").attr("href", "http://sample.olivesoftware.com/" + SkinURL);
		};
		dispFrame$.find("#entry_authbutt_" + x + " span").text(dispFrame$.find("#entry_authbutt_" + x).attr("mode") + " Auth");
	};
	
	function exportList() { // 5.1.0
		var expListCount = navList$.find("li:visible").length; //count visible list items
		//build iFrame
		export$.find("#exptext").html("<h1>Number of Records: " + expListCount + "</h1><br/><iframe id='idata' height='640' width='100%' frameborder='0'></iframe>");
		var iData = document.getElementById('idata');
		iData = (iData.contentWindow) ? iData.contentWindow : (iData.contentDocument.document);
		
		//built table
		var expListTable = "<link rel='stylesheet' type='text/css' href='styles/qaa.css'/><table id='expListTable' border='1'><tr><th>Parent</th><th>Publication</th><th>Skin Name</th><th>Repository ID</th><th>App + Version</th><th>Status</th><th>Auth</th><th>URL</th></tr>";
		
		for (var i = 1; i <= expListCount; i ++) {
			var listid = navList$.find("li:nth-child(" + i + ")").attr("id");
			if (navList$.find("li:nth-child(" + i + ")").hasClass("hidden")) { // if list item is hidden, don't display and increment count
				expListCount++;
			} else {
				expListTable += "<tr>";
				expListTable += "<td>" + NewLink[listid].parent + "</td>";
				expListTable += "<td>" + NewLink[listid].publication + "</td>";
				expListTable += "<td>" + NewLink[listid].skin + "</td>";
				expListTable += "<td class='szlim'>" + NewLink[listid].repo + "</td>";
				expListTable += "<td>" + NewLink[listid].app + NewLink[listid].ver + "</td>";
				expListTable += "<td class='stat" + NewLink[listid].stat + "'>" + StatusText[NewLink[listid].stat] + "</td>";
				expListTable += "<td class='szlim auth" + NewLink[listid].auth + "'>" + AuthType[NewLink[listid].auth];
					if (NewLink[listid].auth == 0) {
						expListTable += " [" + unescape(NewLink[listid].passphrase) + "]";
					}
				expListTable += "</td>";
				expListTable += "<td>" + GetAuthLink(listid, "return") + "</td>";
				expListTable += "</tr>"
			}
		}
 		expListTable += "</table>"
		
		export$.dialog("open");
		iData.document.write(expListTable);
	};
	
	/*Initial Run functions*/
	CheckQueryStrings(); //new with 4.7.11
	GetTheDate();
	setNavFrame();
	//loadXMLData();
	loadJSONData();
	applyFilter();
});

/* CHANGE LOG

2012-09-10: 4.1.5: added OMA
2012-09-11: 4.1.6: added .86 link
2012-09-13: 4.1.7: moved .86 link button (in accordance to .86 being added to LB)
2012-09-20: 4.1.8: added .84 link
2012-09-24: 4.1.9: added .79 link
2012-09-24: 4.1.10: added code to handle ParFilter with spaces
2012-09-24: 4.1.11: removed .85 and .83
2012-09-24: 4.1.12: changed style of Trial sites
2012-10-01: 4.2.0: added 85; changed how servers are stored
2012-10-01: 4.2.1. added 83
2012-10-02: 4.2.2 "All" button separated to 32-bit and 64-bit
2012-10-03: 4.2.3: Removed 32-bit machines
2012-10-09: 4.3.0: Consolidated Authentication data; added NIE flag, added Dead flag, additional design/functionality changes
2012-10-10: 4.3.1: added "parentorg" class to parent names
2012-11-05: 4.3.2: added skin name to abbr title for app, so filtering will now also work on skin name
2012-11-07: 4.3.3: added OTB (Olive Text Book) recognition, and added 88 as a test server
2012-11-07: 4.3.4: modified Cache clearing display
2012-11-13: 4.3.5: reworked Cache clearing to be more robust
2012-11-13: 4.3.6: added publication name specific class to each entry, in anticipation of simplifying list based on publication name (instead of multiple entries per pub name, will have a single pub name entry with sub-entries)
2012-11-14: 4.3.7: Fixed bug where Indexing and Akamai clearing erroneously "remembering" prior publications; also allowed ODE sites with multiple repositories to cache clear them all (like in indexing)
2012-11-15: 4.4.0: Consolidated Indexer and Cache Clearer to one <div>
2012-11-17: 4.4.1: fixed bug in Index All process
2012-11-20: 4.5.0: Added "Back Issue" function; also removed ?Reader= from OMV and iReader.
2012-11-21: 4.5.1: IE bug fixed (console.log) and "APD5" added to "ODE" definitions; "RSSFeed" replaced with "Feed"
2012-11-27: 4.5.2: Added troubleshooting URLs to iReader skins
2012-12-26: 4.5.3: Added variable for Index server (IdxSvr), set to "88", and changed indexing from .81 to IdxSvr variable (in anticipation of .81 being mothballed)
2012-12-28: 4.6.0: DATA CHANGE: adding version as separate field
2012-12-31: 4.6.1: Bug-fix; All applications filter wasn't working; also added "enter=true" to APA skins not hosted by Olive
2013-01-02: 4.6.2: Added article test link to iReader test page
2013-01-04: 4.6.3: Removed unused parent and publication specific classes in order to improve performance
2013-01-15: 4.6.4: .81 is no longer "sample"; .88 is.
2013-01-24: 4.6.5: fixing APD2.7 code (adding Daily= parameter to URL)
2013-01-28: 4.6.6: added ViewArticle.aspx to iReader testing
2013-02-04: 4.6.7: added Bee Publishing custom feeds (Special Rule 4)
2013-02-07: 4.6.8: modified link entry close button to be more IE9 friendly (includes style change); replaced "random" button with randomizer icon
2013-02-08: 4.6.9: improved Bee Publishing custom feeds
2013-02-12: 4.6.10: improved Site Summary (removed extra "/")
2013-02-13: 4.6.11: added APA5 code
2013-04-18: 4.6.12: added OMV cache clearing capability (based on Itay's modifications to purgedata.ashx)
2013-04-21: 4.6.13: added iReader cache clearing capability (based on Itay's modifications to purgedata.ashx)
2013-04-30: 4.6.14: added sb.olivesoftware.com to Cache clearing; removed "81" button, added "SB" button
2013-05-08: 4.6.15: Fixed "Back" issues for non-authenticating ODE skins
2013-05-17: 4.6.16: Added app name to information window
2013-06-26: 4.6.17: Added SpcRule 5, allowing some external sites to be indexed from QAA
2013-09-11: 4.6.18: Giving ParFilter="Tribune" access to double-click pub summary info
2013-11-21: 4.6.19: Unescaping Passphrase (Passphrase will now be escaped within XML)
2014-01-13: 4.7.0: Changing "dead" value to enumerated "status"
2014-01-14: 4.7.1: added special rule #6 for ATS skins using default VD
2014-01-20: 4.7.2: added "Digital2" for new test load balancer
2014-01-21: 4.7.3: removed Digital2 (no longer needed), added special rule for APD2.x skins allows for low level ("default") virtual directory
2014-01-21: 4.7.4: changed status "in progress" links to default to Sample, not Digital
2014-01-21: 4.7.5: changed "in progress" default to "sample" ONLY if domain is blank or "digital"
2014-03-05: 4.7.6: added ODN
2014-03-05: 4.7.7: changed auth URL for OTB and ODN to be 3rd generation, not 2nd generation (in line with OMV, not ODE)
2014-03-17: 4.7.8: fix Under Construction links for Tablet
2014-05-14: 4.7.9: changed indexing for OTB to correct collection ("OTB")
2014-05-19: 4.7.10: replaced "Many" in repo display for skins with many repos to a number of pubs. Involved updating data to replace delimiter from "/" to ",". Also added Repo codes to summary window
2014-06-17: 4.7.11: added Filter= query string capability, to pre-load filtered search via URL API ["?q={query}"]
2014-06-17: 4.7.12: for "In progress" skins with custom domains, still default to "sample" (custom domains don't function until skin is switched to live)
2014-08-05: 4.7.13: OTB now defaults to "ebook.olivesoftware.com"
2014-08-12: 4.7.14: added "ODN" indexing mode
2014-09-09: 4.7.15: removed "ODN" indexing mode, replacing it with ODE
2014-09-11: 4.7.16: added "82" link to OTB skins
2014-09-22: 4.7.17: appended "default.aspx" to end of ODN skin links
2014-09-29: 4.8.0: changes to "Process All" button (now reads actual HTML content and opens link there
2014-09-29: 4.8.1: Addition of Itay's repo test link
2014-10-01: 4.8.2: added CET
2014-09-22: 4.8.3: appended "default.aspx" to end of APA5 skin links
2014-10-01: 4.8.4: added CRT
2014-12-24: 4.9.0: changed some variable names, changed ability to enable or disable authenticating URLs
2015-01-02: 4.9.1: fix "Test" link to accommodate for multiple repositories
2015-02-09: 4.9.2: added ODN cache clearing
2015-06-12: 4.9.3: updated CET default domain and added "ODB" application
2015-08-10: 4.9.4: added link to .82 for CRT and CET
2015-09-04: 4.9.5: fixed "Reset filter"
2015-10-15: 4.9.6: added .72 to list of 64bit load balanced machines, adding Server IDs as abbr's
2015-10-23: 4.9.7: replaced .72 with .56
2015-10-25: 4.9.8: updated Akamai URL [AR]
2015-11-06: 4.10.0: added "CP" data field (to be used to clear Akamai CP codes)
2015-11-13: 4.10.1: corrected Akamai CP URL
2015-11-19: 4.10.2: added .93 to list of 64bit load balanced machines
2015-11-24: 4.10.3: applied Special Rule "1" (USA Today short URLs) to ODN as well as ODE
2015-12-19: 5.0.0: converted from XML Data Source to JSON
2015-12-21: 5.0.1: fixed passphrase escape bug; fixed restrictions bug; fixed status bug
2015-12-22: 5.0.2: added "Reload" button, since simple refresh wasn't reloading JSON data; fixed ParFilter bug
2016-01-02: 5.0.3: removed "Safe To Demo" field from dataset; changed Hosted field to "External"; updated Status enumeration
2016-01-05: 5.0.4: fixed CP code bug (wrong CP code appearing for sites without CP codes)
2016-01-05: 5.0.5: Added "default" CP code for sites without CP codes; removed cache clearing for demo skins
2016-03-07: 5.0.6: fixed bug with Restrictions default (can't default it to true; need to default to false)
2016-05-24: 5.1.0: added "Export" button
2016-06-22: 5.1.1: added ODE skin settings link to ODE "Test" option
2016-07-22: 5.1.2: Internal Test now defaults to staging.olivesoftware.com just as "in progress" does
2016-08-05: 5.1.3: Updated UI, "SHOW|HIDE auth" instead of "Turn ON|OFF Auth"
2016-09-14: 5.1.4: Added "digitalaws.olivesoftware.com" as an option for ODN and APA5
2016-12-05: 5.1.5: Added "DVR-Sample" and "231" AWS server links
2016-12-07: 5.1.6: Bug-fixes to AWS links; added /library.aspx to iReader links\
2016-12-11: 5.1.7: In progress sites now have AWS-STAGING link
2016-12-13: 5.1.8: Added AWS link for CET (PSServer1)
2016-12-20: 5.1.9: Updated AWS CET link to include "live" CETs; also changed IP 35.160.194.70 to connect.olivesoftware.com
2017-01-18: 5.1.10: replaced "35.160.191.84" with "sample.olivesoftware.com"
2017-01-24: 5.1.11: Added special rule for Time Traveler application
2017-01-24: 5.2.0: Preparing to move from Denver to AWS; swapped prominence of "staging.olivesoftware.com" and "sample.olivesoftware.com"
2017-01-26: 5.2.1: Changed URL of Akamai cache clearing from domain "sample.olivesoftware.com" to "connect.olivesoftware.com"
2017-01-31: 5.2.2: Changed default domain for CET (and CRT) to "connect.olivesoftware.com"; removed separate link to "AWS-PSS"
2017-02-03: 5.2.3: Changed indexing to happen on AWS, and updated servers to be on AWS
2017-02-05: 5.2.4: Removed sample.olivesoftware.com from QAA
2017-02-07: 5.2.5: Fixed STAGE button error (always showing authenticating URL even when auth is "hidden"); updated ADLPROC URL
2017-02-14: 5.2.6: Removed final references to Denver data center
2017-02-16: 5.2.7: Fixed server button auth toggling
2017-05-10: 6.0.0: Added three fields: "Primary", "Wrappers", "timestamp"; removed "Test" from Other Flags
2017-05-11: 6.0.1: Now app version drop down is sorted
2017-05-11: 6.0.2: Adds "Has Timestamp" filter [TO DO: Determine items older than 1 month and 1 week; add those filters]
2017-06-16: 6.0.3: For domain "digital2.olivesoftware.com", change protocol from HTTP to HTTPS
2017-06-21: 6.0.4: Escaping Publication Name (to support apostrophes in publication name); also fixed Reset Filter
2017-07-10: 6.0.5: Added browse.ashx link to ODN skin > Test
2017-07-18: 6.0.6: Added special rule ("9") for HTTPS (that isn't digital2.olivesoftware.com)
2017-08-24: 6.0.7: Adding test.olivesoftware.com as Test server ("clone" of Staging)
2017-12-25: 6.1.0: Combining all CSS into single media query'd file

*/