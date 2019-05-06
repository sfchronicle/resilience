import React, { PureComponent } from 'react'

import Layout from '../components/layout'
import TrackerMap from '../components/trackermap'
import RecentNews from '../components/recentnews'
import Credits from '../components/sfc/credits'
import CreditLine from '../components/sfc/creditline'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Get data from config
let projectConfig = require("../../project-config.json");
let project = projectConfig.PROJECT;

// Get data from quake server
let serverNorCalData = {};
let serverSoCalData = {};
let serverUSAData = {};
let serverWorldData = {};
let quakeServerData = { 
  quakes: [],
  shakemaps: []
};
try {
  serverNorCalData = require("../data/norcal_data.sheet.json");
  serverSoCalData = require("../data/socal_data.sheet.json");
  serverUSAData = require("../data/usa_data.sheet.json");
  serverWorldData = require("../data/world_data.sheet.json");
  quakeServerData = require("../data/quake_server.sheet.json");
} catch (err){
  // That's okay
}
console.log("USGS data", serverNorCalData, serverSoCalData, serverUSAData, serverWorldData, quakeServerData);

// Bring in moment to handle dates
var moment = require('moment');

// Get dates for requests
var startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
var endDate = moment().add(2, "days").format("YYYY-MM-DD");

// Save current env
const env = process.env.GATSBY_DEPLOY_ENV;

// Format quakes data to drop it into state immediately
// Filter Nevada results out of norcal
// We'll get them back in if they have a 5.0 via the USA search
let patt = new RegExp(", Nevada$");
serverNorCalData.features = serverNorCalData.features.filter((item) => {
  return patt.test(item.properties.place) === false;
});
// Filter Mexico out from USA
patt = new RegExp(", Mexico$");
serverUSAData.features = serverUSAData.features.filter((item) => {
  return patt.test(item.properties.place) === false;
});
let resultArray = [serverNorCalData, serverSoCalData, serverUSAData, serverWorldData];
let queryObject = {};
let latestQuake = {
  id: "",
  time: 0,
  lat: "",
  lng: ""
};
// Now smash the results together
for (var i = 0; i < resultArray.length; i++){
  for (var feature in resultArray[i].features){
    let item = resultArray[i].features[feature];
    // Fix direction format
    let formatted_place = item['properties']['place'];
    formatted_place = formatted_place
    .replace(/ N /, " north ")
    .replace(/ S /, " south ")
    .replace(/ E /, " east ")
    .replace(/ W /, " west ")
    .replace(/ [E|N]*?NE /, " northeast ")
    .replace(/ [S|W]*?SW /, " southwest ")
    .replace(/ [N|W]*?NW /, " northwest ")
    .replace(/ [S|E]*?SE /, " southeast ");
    // Add AP CA abbrev
    formatted_place = formatted_place.replace(", CA", ", Calif.")
    // Fix distance format
    let distanceKm = formatted_place.match(/(\d+)km/)[1];
    let distanceMi = parseInt(distanceKm) / 1.609;
    // Round it 
    distanceMi = Math.round( distanceMi * 10 ) / 10;
    // Replace it
    formatted_place = formatted_place.replace(distanceKm.toString() + "km", distanceMi.toString() + " miles");

    // Find the quake with the most recent time
    if (item['properties']['time'] > latestQuake.time){
      latestQuake.id = item['id'];
      latestQuake.time = item['properties']['time'];
      latestQuake.lat = item['geometry']['coordinates'][1];
      latestQuake.lng = item['geometry']['coordinates'][0];
    }

    // Give special priority to CA quakes
    let isCalifornia = false;
    if (i < 2){
      isCalifornia = true;
    }

    // By nature of having the ID as the key, this will keep results de-duped between sets
    queryObject[item['id']] = {
      quakeid: item['id'],
      lat: item['geometry']['coordinates'][1],
      long: item['geometry']['coordinates'][0],
      mag: item['properties']['mag'],
      time: item['properties']['time'],
      prox_place: formatted_place,
      ca_quake: isCalifornia
    }
  }
}

// Create the final array of quakes
// If we already have some info from our EC2, merge that in here so it takes priority
// Order: Priority items first by date, then non-priority by date
let quakeArray = [];
for (let quake in Object.keys(queryObject)){
  //console.log("PUSHING IN", quake, Object.keys(queryObject)[quake], queryObject[Object.keys(queryObject)[quake]])
  quakeArray.push(queryObject[Object.keys(queryObject)[quake]]);
}
// Combine with server data
quakeArray = quakeArray.concat(quakeServerData.quakes);
// Now sort!
quakeArray.sort((b, a) => {
  let result = 0;
  if (a.priority && !b.priority){
    result = 1;
  } else if (!a.priority && b.priority){
    result = -1;
  } else { // Either neither is priority or both are, so check time
    if (moment(a.time).isAfter(moment(b.time))){
      result = 1;
    } else if (moment(a.time).isBefore(moment(b.time))){
      result = -1;
    }
    // If both are the same time (which shouldn't happen) result is already 0
  }
  return result;
});

console.log("FINALIZED QUAKE ARRAY", quakeArray);

export default class IndexPage extends PureComponent {
  constructor() {
    super()
    this.state = {
      quakes: quakeArray,
      selected_quake: 0
    }

    this.map = React.createRef();
  }

  componentDidMount() {
    
  }

  panToQuake(e, lat, lng, index){
    // Update active quake
    this.setState({
      selected_quake: index
    }, () => {
      this.map.current.panToQuake(lat, lng, index);
    });
  };

  adjustQuakeNav(status){
    // Add/remove fixed to quake nav
    this.setState({
      fixedNav: status
    });
  }

  selectFromList(keyIndex){
    // Update active quake
    this.setState({
      selected_quake: keyIndex
    });
  };

  // Enable the social popup
  handleFacebookClick(e) {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fprojects.sfchronicle.com%2F${ project.SUBFOLDER }%2F${ project.SLUG }%2F`, 'facebook-share-dialog', 'width=626,height=436');
    return false;
  }

  convertDatesToAP (dateString) {
  	// Convert date string to AP style abbreviations
  	let newDateString = dateString;
  	newDateString = newDateString.replace('January', 'Jan.').replace('February', 'Feb.').replace('August', 'Aug.').replace('September', 'Sept.').replace('October', 'Oct.').replace('November','Nov.').replace('December','Dec.');
  	// Return the result
  	return newDateString;
  }

	render () {
		return (
		  <Layout>
		    <div id="project-wrapper">

          <div className="flex-topper" id="flex-top">

            <div id="intro">
              
              <div id="title">
                <a href={env !== "app" ? "https://www.sfchronicle.com" : false} target="_blank" rel="noopener noreferrer">
                  <div className="logo-link link">
                    <img alt="SF Chronicle logo" src="https://projects.sfchronicle.com/shared/logos/sfc_logo_black_small.png"></img>
                  </div>
                </a>

                <h1>{project.DISPLAY_HEADLINE}</h1>

                <div className="social-box">
                  <div className="link social email">
                    <a id="mail-icon" title="Share via email" href={`mailto:?subject=${ project.SOCIAL_TITLE }&body=${ project.DESCRIPTION }%0A%0Ahttps%3A%2F%2Fprojects.sfchronicle.com%2F${ project.SUBFOLDER }%2F${ project.SLUG }`}>
                      <FontAwesomeIcon icon="envelope"/>
                    </a>
                  </div>

                  <div className="link social facebook">
                    <a id="facebook-icon" title="Share on Facebook" href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" onClick={this.handleFacebookClick}>
                      <FontAwesomeIcon icon={["fab", "facebook"]}/>
                    </a>
                  </div>

                  <div className="link social twitter">
                    <a target="_blank" rel="noopener noreferrer" id="twitter-icon" title="Share on Twitter" href={`https://twitter.com/intent/tweet?url=https%3A%2F%2Fprojects.sfchronicle.com%2F${ project.SUBFOLDER }%2F${ project.SLUG }&text=${ project.TWITTER_TEXT }`}>
                      <FontAwesomeIcon icon={["fab", "twitter"]}/>
                    </a>
                  </div>
                </div>

  							<p className="instructions">This earthquake map created in The Chronicle’s newsroom highlights quakes that have occurred in the past 30 days and focuses on epicenters in California. The data updates in real time and comes from the U.S. Geological Survey.</p>
            
                {this.state.quakes &&
                  <p className="instructions"><span className="red">Last updated:</span> <time id="recent-report" dateTime={ moment(latestQuake.time).format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="dateModified">{moment(latestQuake.time).format("MMMM D, YYYY h:mm A").replace("AM", "a.m.").replace("PM", "p.m.")}</time></p>
                }

              </div>

              {this.state.quakes &&
                <div itemScope itemType="http://schema.org/ItemList" className={this.state.fixedNav ? "quakes-list fixed" : "quakes-list"}>
                  {this.state.quakes.map((item, index) => {
                    let quakeObj = item;
                    // Handle time 
                    let duration = moment.duration(moment().diff(moment(quakeObj.time)));
                    let minutes = duration.asMinutes();
                    // Format the class for the list item
                    let quakeClass = this.state.selected_quake === index ? "quake-item active" : "quake-item";
                    // Alert criteria here
                    if (quakeObj.ca_quake && quakeObj.mag > 6){
                      // Alert status at >6 in CA
                      quakeClass += " alert";
                    } else if (!quakeObj.ca_quake && quakeObj.mag > 8){
                      // Alert status at >8 anywhere
                      quakeClass += " alert";
                    }

                    let timeWord = "";
                    let timeAmount = 0;
                    if (minutes < 1440){
                      if (minutes >= 60){
                        // Measure in hours
                        timeAmount = Math.floor(minutes/60);
                        if (timeAmount === 1){
                          timeWord = "hour";
                        } else {
                          timeWord = "hours";
                        }
                      } else {
                        // Measure in minutes
                        timeAmount = Math.floor(minutes);
                        if (timeAmount === 1){
                          timeWord = "minute";
                        } else {
                          timeWord = "minutes";
                        }
                      }
                    }

                    return (
                      <div className={quakeClass} onClick={(e) => this.panToQuake(e, quakeObj.lat, quakeObj.long, index)} key={"quake" + index}>
                        <div className="bigmag">
                          <div>
                            <p>{(Math.round( quakeObj.mag * 10 ) / 10).toFixed(1)}</p>
                            <p className="smallword">magnitude</p>
                          </div>
                        </div>
                        <div className="quake-info">
                          {/* Handle if time is less than 24 hours*/}
                          { minutes < 1440 ? (
                            <div className="timestamp">{timeAmount} {timeWord} ago</div>
                          ) : (
                            <div className="timestamp">{moment(quakeObj.time).format("MMMM D, YYYY h:mm A").replace("AM", "a.m.").replace("PM", "p.m.")}</div>
                          )}
                          <br />
                          <span itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">Epicenter {quakeObj.prox_place}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              }
            </div>

            {/* Quake map here */}
            {this.state.quakes ? (
              <TrackerMap ref={this.map} quakes={this.state.quakes} serverData={quakeServerData} startLat={latestQuake.lat} startLng={latestQuake.lng} latestQuake={latestQuake.id} selectFromList={this.selectFromList.bind(this)} adjustQuakeNav={(status) => this.adjustQuakeNav(status)} />
            ) : (
              <div id="tracker-outer">
                {/* Simulate what's supposed to be there so it's sized correctly */}
                <div className="map-wrapper loading">
                  <FontAwesomeIcon icon="globe" className="faa-tada animated" />
                </div>
              </div>
            )}

          </div>

          {env !== "app" &&     
            <RecentNews />
          }

          <hr className="about-border" />

          <h2>About the data</h2>

          <p className="description-text">The Quake Tracker displays quakes from the past 30 days with magnitudes above 3.0 in Northern California, 4.0 in Southern California, 5.0 in the United States, and 7.0 anywhere in the world. Quakes below magnitude 3.0 are often not felt and do not appear on this map.</p>

          {/*
          <p className="description-text">The fault layer only shows faults in and around California that have experienced a surface rupture in the last 150 years. There are many more historical faults not shown on this map.</p>
          */}

          <p className="description-text">All data in this project comes from the U.S. Geological Survey. Visit the agency’s site to opt into its <a href="https://earthquake.usgs.gov/ens/" target="_blank" rel="noopener noreferrer">Earthquake Notification Service.</a></p>

          <hr/>

          <div id="credits">
            <h2>Credits</h2>
            <Credits type="Newsroom Developers">
              <CreditLine name="Evan Wagstaff" email="Evan.Wagstaff@sfchronicle.com" twitter="evanwagstaff" />
              <CreditLine name="Lucio Villa" email="LVilla@sfchronicle.com" twitter="luciovilla" />
            </Credits>
            <Credits type="Managing Editor, Enterprise">
              <CreditLine name="Michael Gray" email="mgray@sfchronicle.com" twitter="GrayMikeG" />
            </Credits>
            <Credits type="Managing Editor, Digital">
              <CreditLine name="Tim O'Rourke" email="torourke@sfchronicle.com" twitter="TimothyORourke" />
            </Credits>
            <Credits type="Editor In Chief">
              <CreditLine name="Audrey Cooper" email="acooper@sfchronicle.com" twitter="audreycoopersf" />
            </Credits>
          </div>
		    </div>
		  </Layout>
		)
	}
}