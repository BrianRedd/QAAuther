/*--------------------------------------------------------

* Filename: scripts.js
* Description: JS file for QAAutherEditor

* Author: R. Brian Redd

--------------------------------------------------------*/   

$(document).ready(function () {

	var version = "6.1.0";

	/*VARIABLES
	-------------------------------*/
	
	var headerheight = 75;
	var rowcontent = new Array();
	var lastsort;
	var Link = new Array();
	var TabHeader = { //used for sort by message
		parent: "Parent Organization",
		publication: "Publication",
		primary: "Primary", //6.0
		repo: "Repository ID",
		app: "Application",
		ver: "Version", //4.6
		domain: "Domain",
		external: "Externally Hosted",
		skin: "Skin Name",
		wrapper: "Wrapper", //6.0
		nie: "NIE Skins",
		auth: "Authentication Type",
		login: "Login Folder",
		passphrase: "Secret Passphrase",
		restrictions: "Restrictions",
		stat: "Status",
		cp: "CP Code",
		spcrule: "Special Rules",
		ts: "Timestamp"
	};
	var RowHtml;
	var AuthType = new Array("Standard", "Free", "Trial", "External");
	var AvailApp = new Array("ADL","AE","AMDD","APD","APA","ATS","BOOK","CET","CRT","Feed","iReader","ODE","ODN","OMA","OMV","OTB","ODB"); //4.7.7
	var StatusText = new Array("Live", "In Progress", "Dead", "Internal Test"); //enumerated "status" values, [4.7]; updated 5.0.4
	var WrapperOpt = new Array("None","iOS","Android","Both"); //6.0
	var AppOptions = "";
	for (var i = 0; i < AvailApp.length ; i++) {
		AppOptions += "<option value='" + AvailApp[i] + "'>" + AvailApp[i] + "</option>";
	}
	
	var editForm;
	
	//jQuery selector variables
	var contFrame$ = $("#controlframe");
	var editFrame$ = $("#editframe");
	var helpButt$ = $(".helpbutton");
	var help$ = $("#help");
		help$.find(".pageversion").text(version);
	var addButt$ = $("td .addbutton");
	var storeButt$ = $("td .storebutton");
	var storefile$ = $("#storefile");
	var storefilediv$ = $("#storefile div");
	var clearF$ = $("#clearfilter");
	var applyF$ = $("#applyfilter");
	
	contFrame$.css("height",headerheight);
		
	/*GET DATA VIA AJAX*/
	var xParent, xPub, xPrimary, xRepo, xApp, xVer, xDomain, xExt, xSkin, xWrapper, xNIE, xAuth, xLogin, xPass, xRest, xStatus, xCP, xSpcR, xTS;
	var NewLink = new Array();
	var ParentDD = new Array();
		ParentDD[0] = "Any";
	var AppDD = new Array();
		AppDD[0] = "All";
	var timestamp;
	var Users = new Array();
	var UID; //logged-in user's initials
	
	/*FUNCTIONS
	-------------------------------*/
	
	/*GET XML DATA*/
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
		$(xml).find("SITE").each(function(index) {
			xParent = $(this).find("Parent").text(); //parent company
			xPub = unescape($(this).find("Publication").text()); //publication name //6.0.4 escaped
			xPrimary = $(this).find("Primary").text(); //primary skin [6.0]
			xRepo = $(this).find("Repo").text(); //repository ID
			xApp = $(this).find("App").text(); //application
			xVer = $(this).find("Ver").text(); //version [4.6]
			xDomain = $(this).find("Domain").text(); //domain
			xExt = $(this).find("External").text(); //externally hosted?
			xSkin = $(this).find("Skin").text(); //skin name
			xWrapper = $(this).find("Wrapper").text(); //wrapper? [6.0]
			xNIE = $(this).find("NIE").text(); // NIE? [4.3]
			xAuth = $(this).find("Auth").text(); //Authentication level [4.3]: 0 - standard, 1 - free, 2 - demo/trial, 3 - non-Olive auth (combined older fields)
			xLogin = $(this).find("Login").text(); //Login folder
			xPass = unescape($(this).find("Passphrase").text()); //Passphrase (or sign-in credentials) ; 4.6.6: unescaped
			xRest = $(this).find("Restrictions").text(); //restrictions
			xStatus = $(this).find("Status").text(); //is site dead? [4.3]  //changed to status in 4.7
			xCP = $(this).find("CP").text(); //4.10 CP Code
			xSpcR = $(this).find("SpcRule").text(); //Special Rules
			xTS = $(this).find("TS").text(); //timestamp 6.0.1
			NewLink[index] = new setData(xParent, xPub, xPrimary, xRepo, xApp, xVer, xDomain, xExt, xSkin, xWrapper, xNIE, xAuth, xLogin, xPass, xRest, xStatus, xCP, xSpcR, xTS);
		});
		Sorter();
	}
	/*end*/
	
	/*GET JSON DATA*/
	function loadJSONData() {
		console.log("Loading JSON Data");
		$.getJSON("data/QAAutherData.json", function(data) {
			timestamp = data.timestamp;
			console.log("Timestamp: " + timestamp);
			$.each(data.sites, function(index) {
				var site = this;
				//console.log("From JSON: " + index + ":" + site.Skin);
				NewLink[index] = new setData(site.Par, site.Pub, site.Primary, site.Repo, site.App, site.Ver, site.Dom, site.External, site.Skin, site.Wrapper, site.NIE, site.Auth, site.Login, site.Pass, site.Rest, site.Stat, site.CP, site.SpcR, site.TS);
			});
			Sorter();
		});
	};
	
	function setData(par, pub, primary, rep, ap, ver, dom, ext, skn, wrap, nie, aut, log, pas, res, stat, cp, spr, ts) {
		this.parent = par; //parent = parent org (else blank)
			if (!par) this.parent = "";
		this.publication = unescape(pub); //publication = pub name //6.0.4
		this.primary = primary;
		if (!this.primary) {this.primary = false};
		this.repo = rep; //repo = repo ID
		this.app = ap; //app = application value
		this.ver = ver; //version
			if (!ver) this.ver = "";
		this.domain = dom; //domain = domain; if no domain denoted, default to digital.olivesoftware.com
			if (!dom) this.domain = "";
		this.external = ext;
		if (!this.external) {this.external = false};
		/*if (hos == true) {
			this.external = true; //external = externally hosted; defaults to "false"
			} else {
			this.external = false;
			}*/
		this.skin = skn; //skin = skin name
		this.wrapper = wrap; //0: none, 1: iOS, 2: Android, 3: Both
			if (!wrap) this.wrapper = 0;
		this.nie = nie;
		if (!nie) {
			this.nie = false;
		}
		this.auth = aut; //level of authentication in skin; defaults to "0" (standard)  [4.3]
			if (!aut) this.auth = 0;
		this.login = log; //login = login folder; defaults to "n/a"
			if (!log) this.login = "n/a";
		this.passphrase = unescape(pas); //passphrase = secret pass phrase
			if (!pas) this.passphrase = "n/a";
		if (!res) { //5.0.6
			this.restrictions = false;
			} else {
			this.restrictions = res;
			}
		this.stat = stat; //was "dead" now enumerated status [4.7]
		if (!stat) this.stat = 0;
		this.cp = cp; //4.10
			if (!cp) this.cp = "";
		this.spcrule = spr;
			if (!spr) this.spcrule = "";
		this.recent = false;
		this.ts = ts; //6.0.1
			if (!ts) this.ts = "";
			if (ts == timestamp) this.recent = true;
		this.edited = false;
		this.hidden = false; //4.6.1
	};
	
	/*GET USER JSON DATA*/
	function loadUserJSONData() {
		console.log("Loading User JSON Data");
		$.getJSON("inc/Users.json", function(data) {
			$.each(data.users, function(index) {
				var user = this;
				Users[index] = new setUserData(user.name, user.pw, user.id);
			});
		}).done(function() {
			console.log(Users[0].name);
			checkSignInCookie();
		});
	};
	
	function setUserData(usr, pw, id) {
		this.name = usr;
		this.user = usr.toLowerCase();
		this.pw = pw;
		this.id = id;
		//console.log("User Data: Name: " + this.name + ", User Name: " + this.user + ", Password: " + this.pw + ", User ID: " + this.id);
	}
	
	function getCurrentTime() {
		var currentTime = new Date();
		var month = currentTime.getMonth() + 1;
		if (month < 10){
			month = "0" + month
		};
		var day = currentTime.getDate();
		if (day < 10){
			day = "0" + day
		};
		var year = currentTime.getFullYear();
		var hours = currentTime.getHours();
		if (hours < 10){//6.0.3
			hours = "0" + hours
		};
		var minutes = currentTime.getMinutes();
		if (minutes < 10){
			minutes = "0" + minutes
		};
		return year + "-" + month + "-" + day + ", " + hours + ":" + minutes + " [" + UID + "]";
	};
	
	function Sorter() { //initial data sorter 
		for (i=0; i < NewLink.length; i++) {
			Link[i] = i;
		};
		
		lastsort = "publication"; //defines last sorted by
		$(".publication").addClass("sort").attr("sort","asc");
		
		for (i=0; i < NewLink.length-1; i++) {
			for (ii=i+1; ii <NewLink.length; ii++) {
				if (NewLink[Link[i]][lastsort] > NewLink[Link[ii]][lastsort]) {
					temp = Link[i];
					Link[i] = Link[ii];
					Link[ii] = temp;
				}
			}
		};
		PopEditFrame(false);
	};
	
	function PopEditFrame(clear) { //populates the edit frame
		if (clear) editFrame$.find(".dataitem").remove();
		for (tt=0; tt < NewLink.length; tt++) { //loop through data-set
			sltemp = Link[tt];
			WriteRow(sltemp);
			editFrame$.find("table").append(RowHtml);
		}
		editFrame$.find(".loading").fadeOut("slow"); //fades out loading message
		editFrame$.find(".editbutton").click(function() { //defines "edit" button //with4.6.1, editbutton has id = ebxx
			EditData($(this).attr("id"))
		});
		editFrame$.find(".clonebutton").click(function() { //defines "clone" button //new with 4.6.1,
			CloneData($(this).attr("id"))
		});
		editFrame$.find(".deletebutton").click(function() { //defines "remove" button //with4.6.1, deletebutton has id = dbxx
			DeleteData($(this).attr("id"))
		});
		editFrame$.find(".timebutton").click(function() { //defines "timestamp" button
			ItemTimestamp($(this).attr("id"));
		});
		editFrame$.find(".abbrshow").click(function() { //4.6.2 (was dblclick initially - changed to single)
			var temp = $(this).attr("title");
			OpenAbbrShow(temp);
		});
	};
	
	function WriteRow(x) {
		RowHtml = "";
		nltemp = NewLink[x];
		RowHtml = "<tr id='"+x+"' class='dataitem";
		if (nltemp.hidden == true) RowHtml += " hide";
		if (nltemp.edited == true) RowHtml += " edited";
		if (nltemp.recent == true) RowHtml += " recent";
		if (nltemp.stat == 2) RowHtml += " dead";//6.0.6
		RowHtml += "'>";
		RowHtml += "<td><div id='eb"+x+"' class='editbutton imgbutton'><abbr title='Edit Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div><div id='cb"+x+"' class='clonebutton imgbutton'><abbr title='Clone Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div></td>";
		RowHtml += "<td class='parent'>"+nltemp.parent+"</td>";
		RowHtml += "<td class='publication'>"+nltemp.publication+"</td>";
		RowHtml += "<td class='primary " + nltemp.primary + "'>"+nltemp.primary+"</td>";
		var tmprep = nltemp.repo;
		if (tmprep.length > 20) tmprep = "<abbr class='abbrshow' title='" + tmprep + "'>" + tmprep.substr(0,15) + "...</abbr>";
		RowHtml += "<td class='repo'>"+tmprep+"</td>";
		RowHtml += "<td class='app'>"+nltemp.app+"</td>";
		RowHtml += "<td class='ver'>"+nltemp.ver+"</td>";
		var tmpdom = nltemp.domain;
		RowHtml += "<td class='domain'>"+tmpdom+"</td>";
		RowHtml += "<td class='external "+nltemp.external+"'>" + nltemp.external + "</td>";
		RowHtml += "<td class='skin'>" + nltemp.skin + "</td>";
		RowHtml += "<td class='wrapper wrap_" + nltemp.wrapper + "'>" + WrapperOpt[nltemp.wrapper] + "</td>";
		RowHtml += "<td class='nie " + nltemp.nie + "'>" + nltemp.nie + "</td>";
		RowHtml += "<td class='auth " + AuthType[nltemp.auth].toLowerCase() + "'>" + AuthType[nltemp.auth] + "</td>";
		RowHtml += "<td class='login"
		if (nltemp.login == "n/a") RowHtml += " na";
		RowHtml += "'>"+nltemp.login+"</td>";
		var tmppsp = nltemp.passphrase;
		if (tmppsp.length > 20) tmppsp = "<abbr class='abbrshow' title='" + tmppsp + "'>" + tmppsp.substr(0,15) + "...</abbr>";
		RowHtml += "<td class='passphrase"
		if (nltemp.passphrase == "n/a" || !nltemp.passphrase || nltemp.passphrase == "") {
			RowHtml += " na";
			tmppsp = "n/a";
		}
		RowHtml += "'>"+tmppsp+"</td>";
		RowHtml += "<td class='restrictions  "+nltemp.restrictions+"'>"+nltemp.restrictions+"</td>";
		RowHtml += "<td class='status_"+nltemp.stat+"'>"+StatusText[parseInt(nltemp.stat)]+"</td>";
		RowHtml += "<td class='cp'>"+nltemp.cp+"</td>";
		if (nltemp.spcrule != "") {
			tmppsp = "on";
		} else {
			tmppsp = "";
		}
		RowHtml += "<td class='spcrule " + tmppsp + "'>"+nltemp.spcrule+"</td>";
		RowHtml += "<td><div id='tb"+x+"' class='timebutton imgbutton'><abbr title='" + nltemp.ts + "'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div></td>";
		RowHtml += "<td><div id='db"+x+"' class='deletebutton imgbutton'><abbr title='Delete Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div></td>";
		RowHtml += "</tr>";
		return RowHtml;
	};
	
	function tableSort(col,sortby) { //sort by column that was clicked
		//if second time same column is selected (in a row), then reverse sort that column
		if (!sortby) sortby ="asc";
		for (i=0; i < NewLink.length-1; i++) {
			for (ii=i+1; ii <NewLink.length; ii++) {
				if ((NewLink[Link[i]][col] > NewLink[Link[ii]][col] && sortby == "asc") || (NewLink[Link[i]][col] < NewLink[Link[ii]][col] && sortby == "dsc")) { //if (a > b & ascending) || (a < b & descending)
					temp = Link[i];
					Link[i] = Link[ii];
					Link[ii] = temp;
				}
			}
		};
		if (col == lastsort) {
			lastsort = "";
		} else {
			lastsort = col;
		};
		PopEditFrame(true);
	}
	
	function EditData(ebid) { //Edit form function
		var x = ebid.substr(2);
		var nltemp = NewLink[x];
		//replaces existing table row with table row of form.input fields
		editForm = ""; //clears existing editForm variable; editForm is used to define new HTML content for row
		editFrame$.find("#"+x).replaceWith("<tr id='"+x+"' class='editrow'></tr>");
		editForm = "<td><div id='eb"+x+"' class='editbutton imgbutton'><abbr title='Edit Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div><div id='cb"+x+"' class='clonebutton imgbutton'><abbr title='Clone Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div></td>";
		editForm += "<td><form id='parform' name='parform'><label for='parfield'>Parent</label><br/><input type='text' id='parfield' name='parfield' value='"+nltemp.parent+"'/></form></td>";
		editForm += "<td><form id='pubform' name='pubform'><label for='pubfield'>Publication</label><br/><input type='text' id='pubfield' name='pubfield' value='"+nltemp.publication+"'/></form></td>";
		editForm += "<td><form id='primaryform' name='primaryform'><label for='primaryfield'>Primary</label><br/><input type='checkbox' id='primaryfield' name='primaryfield' value='primaryfield' ";
			if (nltemp.primary == true) {
				editForm += " checked = 'checked'";
			};
			editForm += "/></form></td>";
		editForm += "<td><form id='repform' name='repform'><label for='repfield'>Repo</label><br/><input type='text' size='9' id='repfield' name='repfield' value='"+nltemp.repo+"'/></form></td>";
		editForm += "<td><form id='appform' name='appform'><label for='appform'>App</label><br/><select id='appfield' name='appfield'><option value='" + nltemp.app + "'>" + nltemp.app + "</option>" + AppOptions + "</select></form>";
		editForm += "<td><form id='verform' name='verform'><label for='verfield'>Ver</label><br/><input type='text' size='3' id='verfield' name='verfield' value='" + nltemp.ver + "'/></form></td>";
		editForm += "<td><form id='domform' name='domform'><label for='domfield'>Domain</label><br/><input type='text' id='domfield' name='domfield' value='"+nltemp.domain+"'/></form></td>";
		editForm += "<td><form id='extform' name='extform'><label for='extfield'>External</label><br/><input type='checkbox' id='extfield' name='extfield' value='extfield'";
			if (nltemp.external == true) {
				editForm += " checked = 'checked'";
			};
			editForm += "/></form></td>";
		editForm += "<td><form id='sknform' name='sknform'><label for='sknfield'>Skin</label><br/><input type='text' id='sknfield' name='sknfield' value='"+nltemp.skin+"'/></form></td>";
		editForm += "<td><form id='wrapform' name='wrapform'><label for='wrapfield'>Wrapper</label><br/><select id='wrapfield' name='wrapfield'><option value='0'>None</option><option value='1'";
			if (nltemp.wrapper == 1) editForm += "selected";
			editForm += ">iOS</option><option value='2'";
			if (nltemp.wrapper == 2) editForm += "selected";
			editForm += ">Android</option><option value='3'";
			if (nltemp.wrapper == 3) editForm += "selected";
			editForm += ">Both</option></select></form></td>";
		editForm += "<td><form id='nieform' name='nieform'><label for='niefield'>NIE</label><br/><input type='checkbox' id='niefield' name='niefield' value='niefield' ";
			if (nltemp.nie == true) {
				editForm += " checked = 'checked'";
			};
			editForm += "/></form></td>";
		editForm += "<td><form id='autform' name='autform'><label for='autfield'>Authentication</label><br/><select id='autfield' name='autfield'><option value='0'>Standard</option><option value='1'";
			if (nltemp.auth == 1) editForm += "selected";
			editForm += ">Free</option><option value='2'";
			if (nltemp.auth == 2) editForm += "selected";
			editForm += ">Trial</option><option value='3'";
			if (nltemp.auth == 3) editForm += "selected";
			editForm += ">External</option></select></form></td>";
		editForm += "<td><form id='logform' name='logform'><label for='logfield'>Login</label><br/><input type='text' id='logfield' name='logfield' value='"+nltemp.login+"'/></form></td>";
		editForm += "<td><form id='pasform' name='pasform'><label for='pasfield'>Passphrase</label><br/><input type='text' id='pasfield' name='pasfield' value='"+nltemp.passphrase+"'/></form></td>";
		editForm += "<td><form id='resform' name='resform'><label for='resfield'>Restrictions</label><br/><input type='checkbox' id='resfield' name='resfield' value='restrictions'";
			if (nltemp.restrictions == true) {
				editForm += " checked = 'checked'";
			};
			editForm += "/></form></td>";
		editForm += "<td><form id='statusform' name='statusform'><label for='statusfield'>Status</label><br/><select id='statusfield' name='statusfield'><option value='0'"; //[4.7]
			if (nltemp.stat == 0) editForm += "selected";
			editForm += ">Live</option><option value='1'";
			if (nltemp.stat == 1) editForm += "selected";
			editForm += ">In Progress</option><option value='2'";
			if (nltemp.stat == 2) editForm += "selected";
			editForm += ">Dead</option><option value='3'";
			if (nltemp.stat == 3) editForm += "selected";
			editForm += ">Internal Test</option></select></form></td>";
			editForm += "/></form></td>";
		editForm += "<td><form id='cpform' name='cpform'><label for='cpfield'>CP</label><br/><input type='text' id='cpfield' name='cpfield' value='"+nltemp.cp+"'/></form></td>";
		editForm += "<td><form id='spcrform' name='spcrform'><label for='spcrform'>Special</label><br/><input type='text' size='2' id='spcrfield' name='spcrfield' value='"+nltemp.spcrule+"'/></form></td>";
		editForm += "<td><div class='savebutton imgbutton'><abbr title='Save Record'>&nbsp;&nbsp;&nbsp;&nbsp;</abbr></div></td><td></td>";
		editFrame$.find(".editrow").html(editForm); //replaces HTML content of editrow class with editForm
		editFrame$.find(".editbutton").addClass("disabled"); //disables edit button
		editFrame$.find(".clonebutton").addClass("disabled"); //disables clone button - new in 4.6.1
		editFrame$.find(".deletebutton").addClass("disabled"); //disables edit button
		editFrame$.find(".savebutton").click(function() { //defines save button's function
			SaveData(x);  
		});
		/*new with 4.6 - setting default version*/
		setDefVer(x);
		editFrame$.find("#appform").change(function() {
			setDefVer(x);
		});
	};
	
	function setDefVer(x) { //Set default version based on application - new with 4.6
		if (!NewLink[x].ver) {
			var defver; 
			switch(document.appform.appfield.value) {
				case "ODE":
					defver = "5";
					break;
				case "APA":
					defver = "5.1"; //4.7.2
					break;
				case "APD":
					defver = "2.7";
					break;
				case "OMV":
					defver = "1.5";
					break;
				case "iReader":
					defver = "2.7.3";
					break;
				case "ODN":
					defver = "1.5"; //6.0
					break;
				default:
					defver = "";
			}
			document.verform.verfield.value = defver;
		}
	}
	
	function SaveData(x) { //Save form function
		//save object data based on filled in fields
		var nltemp = NewLink[x];
		nltemp.parent = document.parform.parfield.value;
		nltemp.publication = document.pubform.pubfield.value;
		nltemp.primary = document.primaryform.primaryfield.checked;
		nltemp.repo = document.repform.repfield.value;
		nltemp.app = document.appform.appfield.value;
		nltemp.ver = document.verform.verfield.value;
		nltemp.domain = document.domform.domfield.value;
		nltemp.external = document.extform.extfield.checked;
		nltemp.skin = document.sknform.sknfield.value;
		nltemp.wrapper = document.wrapform.wrapfield.value;
		nltemp.nie = document.nieform.niefield.checked;
		nltemp.auth = document.autform.autfield.value;
		nltemp.login = document.logform.logfield.value;
		nltemp.passphrase = document.pasform.pasfield.value;
		nltemp.restrictions = document.resform.resfield.checked;
		nltemp.stat = parseInt(document.statusform.statusfield.value); //4.7
		nltemp.cp = document.cpform.cpfield.value; //4.10
		nltemp.spcrule = document.spcrform.spcrfield.value;
		nltemp.ts = "NOW";
		nltemp.edited = true;
		
		//validate new data
		if (nltemp.app == "ODE" || nltemp.login == "") nltemp.login = "n/a"; 
				
		if (nltemp.domain.indexOf("http") != -1 || nltemp.domain.indexOf(" ") != -1) { //remove http:// and https:// and spaces from domain 
			var temp = nltemp.domain.replace("https", "http");
			temp = temp.replace(/ /g, "");
			temp = temp.replace("http", "");
			temp = temp.replace("://", "");
			nltemp.domain = temp;
		};
		
		/*if (nltemp.publication.indexOf("&") != "-1") {
			nltemp.publication = nltemp.publication.replace("&", "and");
		}; //REMOVED 6.0.4*/
		
		//write new data
		WriteRow(x);

		editFrame$.find("#"+x).replaceWith(RowHtml).addClass("edited");
		if (nltemp.stat == 2) { //6.0.6
			$('#' + x).addClass("dead");
		} else {
			$('#' + x).removeClass("dead");
		}
		
		editFrame$.find(".disabled").removeClass("disabled"); //enables disabled buttons
		editFrame$.find("#"+x+" .editbutton").click(function() { //defines "edit" button
			EditData("eb"+x)
		});
		editFrame$.find("#"+x+" .clonebutton").click(function() { //defines "edit" button
			CloneData("cb"+x)
		});
		editFrame$.find("#"+x+" .deletebutton").click(function() { //defines "remove" button
			DeleteData("db"+x)
		});
		editFrame$.find("#"+x+" .timebutton").click(function() { //defines "timestamp" button
			ItemTimestamp("tb"+x);
		});
		editFrame$.find(".abbrshow").click(function() { //4.6.2
			var temp = $(this).attr("title");
			OpenAbbrShow(temp);
		});
	};
	
	function ItemTimestamp(tbid) {
		var x = tbid.substr(2);
		var temp = NewLink[x].ts;
		if (!temp || temp == "") temp = "before timestamps were recorded";
		if (NewLink[x].edited) temp = "during this session";
		alert("This item last edited " + temp);
	};
	
	function DeleteData(dbid) {
		var x = dbid.substr(2);
		var temp = '"' + NewLink[x].publication + '"';
		if (temp == '""') temp = "this blank entry";
		var delcon = confirm('You sure you want to delete '+temp+'?');
		if (delcon) {
			temp = editFrame$.find("#"+x);
			temp.animate({
				opacity: 0
			}, {
				duration: "slow",
				complete: function() {
					temp.remove();
				}
			});
			NewLink[x] = NewLink[NewLink.length-1];
			NewLink.length = NewLink.length-1;
			for (i=0; i < NewLink.length; i++) {
				Link[i] = i;
			};
		};
	};
	
	function AddData() {
		x = NewLink.length;
		Link[Link.length] = x;
		NewLink[x] = new setData("", "", false, "", "", "", "", false, "", 0, false, 1, "", "", false, 1, "", ""); // set values for new site
		var nltemp = NewLink[x];
		//replaces existing table row with table row of form.input fields
		editForm = ""; //clears existing editForm variable; editForm is used to define new HTML content for row
		editFrame$.find(".dataitem:first").before("<tr id='"+x+"' class='editrow hide'><td colspan='17'>"+x+"</td></tr>");
		editFrame$.find(".editrow").fadeIn("slow");
		EditData("eb"+x);
	};
	
	function CloneData(cbid) { //Clone function - new with 4.6.1
		var tmplnk = NewLink[cbid.substr(2)];
		var x = NewLink.length;
		Link[Link.length] = x;
		NewLink[x] = new setData(tmplnk.parent, tmplnk.publication, false, tmplnk.repo, tmplnk.app, tmplnk.ver, tmplnk.domain, tmplnk.external, tmplnk.skin + "_COPY", 0, tmplnk.nie, tmplnk.auth, tmplnk.login, tmplnk.passphrase, tmplnk.restrictions, 1, tmplnk.cp, tmplnk.spcrule);
		NewLink[x].restrictions = tmplnk.restrictions;
		NewLink[x].edited = true;
		editFrame$.find("#" + cbid.substr(2)).after("<tr id='"+x+"' class='editrow hide'><td colspan='17'>"+x+"</td></tr>");
		editFrame$.find(".editrow").fadeIn("slow");
		EditData("eb"+x);
		}
	
	function StoreData() {
		//alert("This is the part where we store the "+NewLink.length+" records into a file!");
		storefile$.find("#hidestorefile").click(function() {
			storefile$.fadeOut("slow");
		});
		storefile$.fadeIn("slow");
		storefile$.find("span").text(NewLink.length);
		storefile$.find("#idata").remove();
		storefile$.find("br").after("<iframe id='idata' height='90%' width='100%'></iframe>");
		var iData = document.getElementById('idata');
		iData = (iData.contentWindow) ? iData.contentWindow : (iData.contentDocument.document);
		timestamp = getCurrentTime();
		var fileheader = '{"timestamp":"' + timestamp + '",<br/>';
		fileheader += '"fields":[{"Name":"Par","Label":"Parent","Default":""},{"Name":"Pub","Label":"Publication"},{"Name":"Primary","Label":"Primary"},{"Name":"Repo","Label":"Repository ID"},{"Name":"App","Label":"Application"},{"Name":"Ver","Label":"Version","Default":""},{"Name":"Dom","Label":"Domain","Default":"digital.olivesoftware.com"},{"Name":"External","Label":"Externally Hosted","Type":"Bool","Default":false},{"Name":"Skin","Label":"Skin Name"},{"Name":"Wrapper","Label":"Wrapper"},{"Name":"NIE","Label":"NIE","Type":"Bool","Default":false},{"Name":"Login","Label":"Login","Default":"n/a"},{"Name":"Pass","Label":"Passphrase","Default":"n/a"},{"Name":"Rest","Label":"Restrictions","Default":"n/a"},{"Name":"Stat","Label":"Status","Type":"List","Params":[{"0":"Live","1":"In Progress","2":"Dead","3":"Test"}],"Default":0},{"Name":"CP","Label":"CP Code","Default":"n/a"},{"Name":"SpcR","Label":"Special Rules","Default":"n/a"}],<br/>"sites": [<br/>';
		iData.document.write(fileheader);
		for (tt=0; tt < NewLink.length; tt++) { //loop through data-set
			sltemp = Link[tt];
			nltemp = NewLink[sltemp];
			rowcontent[tt] = ""; 
			if (tt > 0) {
				rowcontent[tt] += ',';
			};
			rowcontent[tt] += '{';
			if (nltemp.parent) {
				rowcontent[tt] += '"Par":"'+nltemp.parent+'",';
			};
			rowcontent[tt] += '"Pub":"'+escape(nltemp.publication)+'"'; //escaping 6.0.4
			if (nltemp.primary == true && !nltemp.nie && nltemp.stat == 0 && (nltemp.app == "ODN" || nltemp.app == "APA")) {
				rowcontent[tt] += ',"Primary":true';
			};
			rowcontent[tt] += ',"Repo":"'+nltemp.repo+'"';
			rowcontent[tt] += ',"App":"'+nltemp.app+'"';
			if (nltemp.ver) {
				rowcontent[tt] += ',"Ver":"'+nltemp.ver+'"';
			}
			if (nltemp.domain != 'digital.olivesoftware.com' && nltemp.domain != '') {
				rowcontent[tt] += ',"Dom":"'+nltemp.domain+'"';
			};
			if (nltemp.external == true) {
				rowcontent[tt] += ',"External":true';
			};
			rowcontent[tt] += ',"Skin":"'+nltemp.skin+'"';
			if (nltemp.wrapper != 0) {
				rowcontent[tt] += ',"Wrapper":'+nltemp.wrapper;
			};
			if (nltemp.nie == true) {
				rowcontent[tt] += ',"NIE":true';
			};
			if (nltemp.auth != 0) {
				rowcontent[tt] += ',"Auth":' + nltemp.auth;
			};
			if (nltemp.login != 'n/a') {
				rowcontent[tt] += ',"Login":"'+nltemp.login+'"';
			};
			if (nltemp.passphrase && nltemp.passphrase != 'n/a') {
				rowcontent[tt] += ',"Pass":"'+escape(nltemp.passphrase)+'"';
			};
			if (nltemp.restrictions) {
				rowcontent[tt] += ',"Rest":true';
			};
			if (nltemp.stat != 0) {
				rowcontent[tt] += ',"Stat":'+nltemp.stat;
			};
			if (nltemp.cp != '') {
				rowcontent[tt] += ',"CP":"'+nltemp.cp+'"';
			};
			if (nltemp.spcrule != '') {
				rowcontent[tt] += ',"SpcR":"'+nltemp.spcrule+'"';
			};
			if (nltemp.edited) nltemp.ts = timestamp;
			if (nltemp.ts != '') {
				rowcontent[tt] += ',"TS":"'+nltemp.ts+'"';
			};
			rowcontent[tt] += '}<br/>';
			iData.document.write(rowcontent[tt]);
		}
		var filefooter = ']}';
		//var filefooter = JSON.stringify(NewLink);
		iData.document.write(filefooter);
	}
	
	function OpenAbbrShow(temp) { //4.6.2
		$("#showabbr").remove();
		$("body").append("<div id='showabbr'></div>");
		$("#showabbr").append("<p><input type='text' value='"+temp+"'></input></p>").append("<button id='closeshowabbr'>Close</button>").find("#closeshowabbr").click(function() {
			$("#showabbr").remove();
		});
	};
	
	function ApplyFilter() {
		var ffld = document.filterform.ffield.value;
		var fftr = document.filterform.ftext.value.toUpperCase();
		editFrame$.find(".loading td").text('Finding "'+fftr+'" in "'+ffld.toUpperCase()+'".');
		editFrame$.find(".loading").fadeIn({
			duration: "fast",
			complete: function() {
				for (tt=0; tt < NewLink.length; tt++) { 
					if (NewLink[tt][ffld].toUpperCase().search(fftr) == -1) {
						//editFrame$.find("#"+tt).addClass("hide");
						NewLink[tt].hidden = true;
					}
				}
				if (tt == NewLink.length) {
					PopEditFrame(true);
				}
			}
		});
	}
	
	/*Start cookie functions*/
	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1)
	};
	/*End cookie functions*/
	
	function checkSignInCookie() {
		var x = readCookie("QAAE_sign_in");
		if (x) {
			var y = x.split(".");
			var i = parseInt(y[0]);
			if (y[1] == Users[i].user) {
				loginSuccess(i);
			}
		};
	}
	
	/*Login Success!*/
	function loginSuccess(x) {
		$(".authmodal").hide();
		$("#controlframe h2").show().find("span").text("Welcome " + Users[x].name + "!");
		$("#editframe tr.loading td").text("LOADING... (PLEASE WAIT)");
		UID = Users[x].id;
		createCookie("QAAE_sign_in",x + "." + Users[x].user + "." + UID,30);
		loadJSONData(); //data only loads after successful login
	};
	
	/*Login Failure!*/
	function loginFailure(x) {
		$("#login #message").html("<span class='loading'>Login-in Failure for User " + x + "!</span>")
	};
	
	/*EVENTS
	-------------------------------*/
	
	addButt$.click(function() {
		AddData();
	});
	storeButt$.click(function() {
		StoreData();
	});
	
	$(document).keydown(keyDownHandler);
	function keyDownHandler(e) {
		if(e.keyCode === 13) {
			e.stopPropagation();
			e.preventDefault();
			ApplyFilter();
			return false;
		}
	}
	
	/*Filters [4.3]*/
	clearF$.click(function () {
		document.filterform.ftext.value = "";
		editFrame$.find(".hide").removeClass("hide");
		for (i=0; i < NewLink.length; i++) {
			NewLink[i].hidden = false;
		}
	});
	
	applyF$.click(function () {
		ApplyFilter();
	});
	
	editFrame$.find("th").click(function() { //defines sort by column
		$(".sort").removeClass("sort"); //clear existing "sort" classes
		col = $(this).attr("class"); //assign "col" to column identifier class
		if (!$(this).attr("sort") || $(this).attr("sort") == "dsc") {
			$(this).attr("sort","asc"); //if no "sort" attribute or "descending", set to "ascending"
		} else if ($(this).attr("sort") == "asc") {
			$(this).attr("sort","dsc"); //if column is "ascending", set sort to "descending"
		};
		if ($(this).hasClass("ts")) $(this).attr("sort","dsc");//if column is "timestamp" set sort to "descending"
		var sortby = $(this).attr("sort"); //set sortby parameter
		$(this).addClass("sort");
		editFrame$.find(".loading td").text("Sorting by "+ TabHeader[col] + " [" + sortby.toUpperCase() + "]");
		editFrame$.find(".loading").fadeIn({
			duration: "fast",
			complete: function() {
				tableSort(col,sortby);
			}
		});		
		//sort by column that was clicked
	});
	
	/*Login Button - compares un/pw with JSON data*/
	$("#login button").click(function() {
		var user = 0;
		for (var i = 0; i < Users.length ; i++) {
			if(document.loginform.loginun.value.toLowerCase() == Users[i].user && document.loginform.loginpw.value == Users[i].pw) {
				user = i + 1;
			}
		};
		if (user > 0) {
			loginSuccess(user - 1);
		} else {
			loginFailure(document.loginform.loginun.value.toLowerCase());
		}
	});
	
	/*Logout button*/
	$(".logoutbutton").click(function() {
		eraseCookie("QAAE_sign_in");
		location.reload();
	});
	
	/*Help*/
	helpButt$.click(function() {
		help$.fadeToggle();
		if (helpButt$.hasClass("closehelp")) {
			helpButt$.removeClass("closehelp").find("abbr").attr("title", "Open Help");
		} else {
			helpButt$.addClass("closehelp").find("abbr").attr("title", "Close Help");
		};
	});
	
	loadUserJSONData();
	
	//only after successful login
	//loadXMLData();
	//loadJSONData(); 
	
});

/*CHANGE LOG 
2012-10-11: 4.3.1: "Dead" sites should also automatically be "Not safe to demo";  New sites should default to "safe to demo"
2012-11-21: 4.5.1: Changed application field to drop down
2012-12-28: 4.6.0: DATA Change: adding version as separate field
2013-01-04: 4.6.1: Improved Filtering; Graphical buttons; Clone button
2013-01-05: 4.6.2: Added Dblclick dialog box to access truncated fields
2013-03-21: 4.6.3: Added OMV versioning default
2013-05-13: 4.6.4: Changed OMV default version (from 2 to 1.5) and added iReader default version (2.6)
2013-10-28: 4.6.5: blocked "enter" so page doesn't reload when hitting enter.
2013-11-21: 4.6.6: unescaping passphrase when reading XML, escaping it when storing into XML
2014-01-13: 4.7.0: changed "dead" to enumerated status
2014-01-21: 4.7.1: if skin is not "live", then it is not safe to demo
2014-03-03: 4.7.2: added ODN application
2014-10-01: 4.7.3: added CET application
2014-12-19: 4.7.4: added CRT application
2015-01-14: 4.7.5: changed behavior when existing entry is cloned
2015-03-31: 4.7.6: changed default ODN version to 1.2
2015-06-12: 4.7.7: added "ODB" application
2015-09-23: 4.7.8: changed default ODN version from 1.2 to 1.3
2015-11-06: 4.10.0: added "CP" data field (to be used to clear Akamai CP codes); NOTE: advanced versioning to match QAAuther proper
2015-12-18: 5.0.0: converted from XML data source to JSON
2015-12-21: 5.0.1: fixed "NIE" bug; fixed status bug
2015-12-29: 5.0.2: added line to JSON table listing fields; will be used in QAAv6 (possibly in QAAEv5.x)
2015-12-30: 5.0.3: updated JSON output
2016-01-02: 5.0.4: removed Safe To Demo field; changed Hosted field to "External"; updated Status enumeration
2016-01-04: 5.0.5: fixed clone default status
2016-03-07: 5.0.6: fixed bug with Restrictions default (can't default it to true; need to default to false)
2016-03-16: 5.0.7: added ODN 1.4 as default version
2016-07-31: 5.0.8: removed default versioning from CET
2017-05-01: 6.0.0: added "primary" and "wrapper" fields
2017-05-03: 6.0.1: added "timestamp" field, changed time to 24hour clock
2017-05-10: 6.0.2: updated timestamp (two-digit with leading zero, to improve sorting)
2017-05-11: 6.0.3: fixed bug with timestamp introduced in 6.0.2
2017-06-21: 6.0.4: Escaping Publication Name (to support apostrophes in publication name)
2017-07-18: 6.0.5: Sorting by Timestamp defaults to DESC; updated Sorting backendl added Sorting visual
2017-10-18: 6.0.6: line-through text of entries marked "dead" (added style .dead to each row that is Status=2)
2017-10-24" 6.1.0: Added modal-based authentication ###DRAFT###

-----------*/   