import React, { PureComponent, Fragment } from 'react'

import Layout from '../components/layout'
import TrackerMap from '../components/trackermap'
import RecentNews from '../components/recentnews'
import Credits from '../components/sfc/credits'
import CreditLine from '../components/sfc/creditline'
import RelatedRow from '../components/sfc/relatedrow'
import Byline from '../components/sfc/byline'
import WCMImage from '../components/sfc/wcmimage'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Get data from config
let projectConfig = require("../../project-config.json");
let project = projectConfig.PROJECT;

// Pull data from doc
let docData = require("../data/Defending_Against_Disaster_mainbar.json");

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
    this.state = {
      layer: null
    }

    this.map = React.createRef();
    this.timeout = null;
  }

  componentDidMount() {
    // Only delay map layer on desktop
    if (window.innerWidth > 979){
      this.timeout = setTimeout(() => {
        this.setState({
          layer: "fires"
        })
      }, 3000)
    } else {
      this.setState({
        layer: "fires"
      });
    }
  }

  setLayer(type){
    // Set type of layer for map
    this.setState({
      layer: type
    });
    // Clear timeout if it's ticking
    if (this.timeout !== null){
      clearTimeout(this.timeout);
    }
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

                <p className="byline">
                  <time className="dateline intro-description" dateTime={moment(projectConfig.PROJECT.DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="datePublished">{ pubdateString }</time>
                  { moddateString &&
                    <Fragment>
                      &nbsp;|&nbsp;<time className="dateline mod-date" dateTime={ moment(projectConfig.PROJECT.MOD_DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="dateModified">Updated: { moddateString }</time>
                    </Fragment>
                }</p>

  							<p className="instructions">This map highlights the risk areas in California for three major natural disasters: fires, earthquakes and floods. Select a layer to see the risk areas.</p>


              </div>
            </div>

            <TrackerMap ref={this.map} startLat={37.8044} startLng={-122.2711} chosenLayer={this.state.layer} setLayer={this.setLayer.bind(this)} />

          </div>


          <div className="sec">
            <h2 className="sec-h2">More Chronicle disaster coverage</h2>
          </div>
          
          {linkArray.map((item) => {
            return <a href={item.url}>
              <div className="related-block">
                <div className="thumb">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="text-block">
                  <h2>{item.title}</h2>
                  <p>{item.deck}</p>
                </div>
              </div>
            </a>
          })}

          <div id="credits">
            <h2>Credits</h2>
            <Credits type="Newsroom Developer">
              <CreditLine name="Evan Wagstaff" email="Evan.Wagstaff@sfchronicle.com" twitter="evanwagstaff" />
            </Credits>
            <Credits type="Executive Producer">
              <CreditLine name="Brittany Schell" email="BSchell@sfchronicle.com" twitter="brittlynns" />
            </Credits>
            <Credits type="Managing Editor, Digital">
              <CreditLine name="Tim O'Rourke" email="torourke@sfchronicle.com" twitter="TimothyORourke" />
            </Credits>
          </div>
		    </div>
		  </Layout>
		)
	}
}