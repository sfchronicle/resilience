import React, { PureComponent, Fragment } from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import Image from '../components/image'
import Credits from '../components/sfc/credits'
import CreditLine from '../components/sfc/creditline'
import RelatedRow from '../components/sfc/relatedrow'
import Byline from '../components/sfc/byline'
import NavTop from '../components/sfc/navtop'
import WCMImage from '../components/sfc/wcmimage'

// Get data from config
let projectConfig = require("../../project-config.json");

// Bring in moment to handle dates
var moment = require('moment');

// Imports all static files in the /static/ folder, accessible as an object
// We don't use /images/ because we don't need Gatsby's resizing with WCM image services
const staticFiles = (ctx => { 
  let keys = ctx.keys(); 
  let values = keys.map(ctx);
  return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {});
})(require.context('../static', true, /.*/));

export default class IndexPage extends PureComponent {

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

					<div id="topper">
						<div className="img-wrapper">
              {/* Non-optimized image, but helpful to show gifs and svgs */}
							<img className="starter-img" src={staticFiles["./react.gif"]} alt="Replace this with something descriptive" />
						</div>
					</div>

          {/* This prop will allow the nav to stick when user scrolls past */}
          <NavTop enableStick={true} /> 

          <div id="intro">
            <div id="title">
              <h1>A brave new template v2</h1>
              <p>Words can be like X-rays if you use them properly &mdash; they'll go through anything.</p>
              <div className="byline">
                <span>By</span>
                  { projectConfig.PROJECT.AUTHORS.map((author, index) => {
                    // Pass special flag if this is the last item
                    let isLast = false;
                    if (index === projectConfig.PROJECT.AUTHORS.length - 1){
                      isLast = true;
                    }
                    // Add the bylines
                    return <Byline key={author.AUTHOR_NAME} url={author.AUTHOR_PAGE} name={author.AUTHOR_NAME} index={index} is_last={isLast} />
                  })}
                &nbsp;|&nbsp;
                <time className="dateline intro-description" dateTime={moment(projectConfig.PROJECT.DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="datePublished">{ pubdateString }</time>
                { moddateString &&
                  <Fragment>
                    &nbsp;|&nbsp;<time className="dateline mod-date" dateTime={ moment(projectConfig.PROJECT.MOD_DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ") } itemProp="dateModified">Updated: { moddateString }</time>
                  </Fragment>
                }
              </div>
            </div>
          </div>

          <div className="article">

            <figure className="float-right">
              {/* Super optimized image tag! */}
              <WCMImage WCMID={17243022} />
              <figcaption className="caption">This is a caption</figcaption>
            </figure>

            <p>The Savage nodded, frowning. "You got rid of them. Yes, that's just like you. Getting rid of everything unpleasant instead of learning to put up with it. Whether 'tis better in the mind to suffer the slings and arrows or outrageous fortune, or to take arms against a sea of troubles and by opposing end them... But you don't do either. Neither suffer nor oppose. You just abolish the slings and arrows. It's too easy.</p>

            <Link to="/page-2/">Go to page 2</Link>

          </div>

          <div className="related-link-wrapper">
            <RelatedRow links={ linkArray } />
          </div>



          <div id="credits">
            <h2>Credits</h2>
            <Credits type="Newsroom Developers">
              <CreditLine name="Lucio Villa" email="LVilla@sfchronicle.com" twitter="luciovilla" />
              <CreditLine name="Evan Wagstaff" email="Evan.Wagstaff@sfchronicle.com" twitter="evanwagstaff" />
            </Credits>
            <Credits type="Executive Producer">
              <CreditLine name="Brittany Schell" email="BSchell@sfchronicle.com" twitter="brittlynns" />
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
