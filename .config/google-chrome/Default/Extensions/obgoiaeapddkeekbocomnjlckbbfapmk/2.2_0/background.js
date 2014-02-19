
//-------------------------
var MAJOR_VERSION = "2.2";
	if(localStorage.getItem('ads_status') === null){
		localStorage.setItem('ads_status','enabled');
	}	
	if(!localStorage.getItem('version') || (localStorage.getItem('version') != MAJOR_VERSION)){
		chrome.tabs.create({'url': chrome.extension.getURL('update.html')}, function(tab){});
		localStorage.setItem('version',MAJOR_VERSION);
	}
	/*
	else{	
		if (localStorage.getItem('version') != MAJOR_VERSION){
			localStorage.setItem('version',MAJOR_VERSION);
			if(localStorage.getItem('ads_status') == 'enabled'){
				chrome.tabs.create({'url': chrome.extension.getURL('options/update.html')}, function(tab){});
			}
		}
	}
	*/

