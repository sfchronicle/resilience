
import React, { Component } from "react";
import Waypoint from 'react-waypoint';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Get data from sheet
let storySettings = require("../../data/story_settings.sheet.json");
storySettings = storySettings[0];

class NavTop extends Component {
	constructor(props) {
	  super(props);

	  this.state = {
	    fixed: "",
	    wrapperHeight: "auto"
	  };
	}

  render() {

  	// Handle waypoint crossings
  	this.handleWaypointLeave = ({ previousPosition, currentPosition, event }) => {
    	// Stick the nav
    	if (currentPosition === "above"){
    		this.setState({
    			fixed: "fixed",
    			wrapperHeight: "30px"
    		});
    	}
		}
		this.handleWaypointEnter = ({ previousPosition, currentPosition, event }) => {
    	// Unstick the nav	
    	if (currentPosition === "inside"){
    		this.setState({
    			fixed: "",
    			wrapperHeight: "auto"
    		});
    	}
		}

		// Enable the social popup
		this.handleFacebookClick = (e) => {
			e.preventDefault();
			window.open(`https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fprojects.sfchronicle.com%2F${ storySettings.Year }%2F${ storySettings.Slug }%2F`, 'facebook-share-dialog', 'width=626,height=436');
			return false;
		}

    return (
      <div className="header-wrapper" style={{height: this.state.wrapperHeight}}>
      	{ this.props.enableStick && 
      		<Waypoint
					  onEnter={this.handleWaypointEnter}
					  onLeave={this.handleWaypointLeave}
					/>
      	}
      	<header className={this.state.fixed}>
					<div className="navigation">

					  <a href="https://www.sfchronicle.com" target="_blank" rel="noopener noreferrer">
					    <div className="logo-link link">
				        <img className="desk-logo" alt="SF Chronicle logo" src="https://projects.sfchronicle.com/shared/logos/sfc_logo_black.png"></img>
				        <img className="mobile-logo" alt="SF Chronicle logo" src="https://projects.sfchronicle.com/shared/logos/sfletter_c_black.png"></img>
				      </div>
					  </a>

					  <div className="link">
					    <a className="specialhead-top" href="https://www.sfchronicle.com/special-reports/">Special Report</a>
					  </div>

					  <div className="link social email">
					    <a id="mail-icon" title="Share via email" href={`mailto:?subject=${ storySettings.Title }&body=${ storySettings.SEO_Description }%0A%0Ahttps%3A%2F%2Fprojects.sfchronicle.com%2F${ storySettings.Year }%2F${ storySettings.Slug }`}>
					      <FontAwesomeIcon icon="envelope"/>
					    </a>
					  </div>

					  <div className="link social facebook">
					    <a id="facebook-icon" title="Share on Facebook" href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" onClick={this.handleFacebookClick}>
					      <FontAwesomeIcon icon={["fab", "facebook"]}/>
					    </a>
					  </div>

					  <div className="link social twitter">
					    <a target="_blank" rel="noopener noreferrer" id="twitter-icon" title="Share on Twitter" href={`https://twitter.com/intent/tweet?url=https%3A%2F%2Fprojects.sfchronicle.com%2F${ storySettings.Year }%2F${ storySettings.Slug }&text=${ storySettings.Twitter_Text }`}>
					      <FontAwesomeIcon icon={["fab", "twitter"]}/>
					    </a>
					  </div>

					</div>
				</header>

      </div>
    );
  }
}
// Disable the sticky nav by default
NavTop.defaultProps = {
  enableStick: false
};
export default NavTop;

		
