
/* Contains the settings that let our analytics work */

// Get data from config
let projectConfig = require("../../../project-config.json");
let projectSettings = projectConfig.PROJECT;

// Create author string here
let authorString = "";
for (var i = 0; i < projectSettings.AUTHORS.length; i++){
	// Add author to string
	authorString += projectSettings.AUTHORS[i].AUTHOR_NAME;

	// Add comma if we're not done
	if (i < projectSettings.AUTHORS.length-1){
		authorString += ", ";
	}
}

// If we didn't get any author, sub in default
if (authorString === ""){
	authorString = "San Francisco Chronicle Staff"
}

// If Tim hasn't been added yet, add his name
if (authorString.indexOf("Tim O'Rourke") == -1){
	authorString += ", Tim O'Rourke";
}


// eslint-disable-next-line
if (typeof HDN === "undefined"){
	var HDN = {};
	HDN.dataLayer = {};
	HDN.dataLayer.content = {};
	HDN.dataLayer.href = {};
	HDN.dataLayer.source = {};
	HDN.dataLayer.sharing = {};
	HDN.dataLayer.presentation = {};
	HDN.dataLayer.paywall = {};
}

// HDN.dataLayer object for content and href data
HDN.dataLayer.content.title = `${projectSettings.TITLE}`;
HDN.dataLayer.content.subtitle = "";
HDN.dataLayer.content.objectId = "";
HDN.dataLayer.content.objectType = "channel";
HDN.dataLayer.content.sectionPath = [`${projectSettings.HEARST_CATEGORY}`, 'special projects'];
HDN.dataLayer.content.pubDate = `${projectSettings.DATE} 00:00:00`;
HDN.dataLayer.content.wordCount = "";
HDN.dataLayer.content.keywords = [];
HDN.dataLayer.content.keySubjects = [];
HDN.dataLayer.content.keyPersons = [];
HDN.dataLayer.content.keyOrganizations = [];
HDN.dataLayer.content.keyConcepts = [];
HDN.dataLayer.content.keyCategories = [];
HDN.dataLayer.content.keyPlaces = [];
HDN.dataLayer.content.keyNlpPerson = [];
HDN.dataLayer.content.keyNlpLocation = [];
HDN.dataLayer.content.keyNlpOrganization = [];
HDN.dataLayer.content.keyNlpEvent = [];
HDN.dataLayer.content.keyNlpWorkOfArt = [];
HDN.dataLayer.content.keyNlpConsumerGood = [];
HDN.dataLayer.content.keyNlpOther = [];
HDN.dataLayer.content.keyNlpUnknown = [];

// HDN.dataLayer object for source information
HDN.dataLayer.source.authorName = authorString;
HDN.dataLayer.source.authorTitle = "San Francisco Chronicle Staff";
HDN.dataLayer.source.originalSourceSite = "SF";
HDN.dataLayer.source.publishingSite = "premiumsfgate";
HDN.dataLayer.source.sourceSite = "sfgate";

// HDN.dataLayer object for sharing information
HDN.dataLayer.sharing.openGraphUrl = `${projectSettings.URL}/${projectSettings.SLUG}`;
HDN.dataLayer.sharing.openGraphType = "article";

HDN.dataLayer.href.pageUrl = `${projectSettings.URL}/${projectSettings.SLUG}`;
HDN.dataLayer.href.canonicalUrl = `${projectSettings.URL}/${projectSettings.SLUG}`;
// EXTRA WINDOW-REFS REMOVED HERE AND ADDED IN _DOCUMENT.JS

// HDN.dataLayer object for presentation information
HDN.dataLayer.presentation.hasSlideshow = "";
HDN.dataLayer.presentation.hasSlideshowListView = "";
HDN.dataLayer.presentation.hasVideo = "";
HDN.dataLayer.presentation.hasInteractive = "";

// HDN.dataLayer object for paywall information
HDN.dataLayer.paywall.premiumStatus = "isPremium";
HDN.dataLayer.paywall.premiumEndDate = "";
HDN.dataLayer.paywall.policy = projectConfig.PAYWALL_SETTING;

// Special site var
HDN.dataLayer.site = {
  domain: "projects.sfchronicle.com",
  domainRoot: "sfchronicle",
  subDomain: "www",
  name: "premiumsfgate",
  property: "HC",
  siteId: "35",
  siteUrl: "https://www.projects.sfchronicle.com/",
  timeZone: "Pacific"
}

export default HDN;