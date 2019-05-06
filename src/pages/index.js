import React, { PureComponent, Fragment } from 'react'

import Layout from '../components/layout'
import TrackerMap from '../components/trackermap'
import RecentNews from '../components/recentnews'
import Credits from '../components/sfc/credits'
import CreditLine from '../components/sfc/creditline'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Get data from config
let projectConfig = require("../../project-config.json");
let project = projectConfig.PROJECT;

// Bring in moment to handle dates
var moment = require('moment');

// Get dates for requests
var startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
var endDate = moment().add(2, "days").format("YYYY-MM-DD");

// Save current env
const env = process.env.GATSBY_DEPLOY_ENV;

export default class IndexPage extends PureComponent {
  constructor() {
    super();

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

  // Enable the social popup
  handleFacebookClick(e) {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fprojects.sfchronicle.com%2F${ project.SUBFOLDER }%2F${ project.SLUG }%2F`, 'facebook-share-dialog', 'width=626,height=436');
    return false;
  }

  prepDates () {
    // Convert date to readable time
    this.readablePubDate = this.convertDatesToAP(projectConfig.PROJECT.DATE);
    // Check safely for MOD_DATE
    if (typeof projectConfig.PROJECT.MOD_DATE !== "undefined"){
      this.readableModDate = this.convertDatesToAP(projectConfig.PROJECT.MOD_DATE);
    } else {
      // If MOD_DATE does not exist, set false so it doesn't render
      this.readableModDate = false;
    }
  }

  convertDatesToAP (dateString) {
  	// Convert date string to AP style abbreviations
  	let newDateString = dateString;
  	newDateString = newDateString.replace('January', 'Jan.').replace('February', 'Feb.').replace('August', 'Aug.').replace('September', 'Sept.').replace('October', 'Oct.').replace('November','Nov.').replace('December','Dec.');
  	// Return the result
  	return newDateString;
  }

	render () {
    // Include related links for bottom
    const linkArray = require('../data/sfc/related_links.json');

    // Handle date parsing
    this.prepDates();

    // Convert date string to AP style abbreviations
    let pubdateString = this.readablePubDate;
    let moddateString = "";
    // Only check moddate if we have a value
    if (this.readableModDate){
      moddateString = this.readableModDate;

      // Chop time off pubdate if possible
      try {
        this.readablePubDate = this.readablePubDate.match(/.*\d{4}/gm)[0];
      } catch (err){
        // That's fine
        console.log(err);
      }
    }

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

  							<p className="instructions">This map highlights the risk areas in California for four major natural disasters: earthquakes, fires, floods and landslides. Enter your address to see which zones impact your home.</p>
            
                  <p className="instructions"><time className="dateline intro-description" dateTime={moment(projectConfig.PROJECT.DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="datePublished">{ pubdateString }</time>
                  { moddateString &&
                    <Fragment>
                      &nbsp;|&nbsp;<time className="dateline mod-date" dateTime={ moment(projectConfig.PROJECT.MOD_DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="dateModified">Updated: { moddateString }</time>
                    </Fragment>
                  }</p>

              </div>
            </div>

            {/* Quake map here */}

            <TrackerMap ref={this.map} startLat={37.8044} startLng={-122.2711} />

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