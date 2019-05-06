
/* Layout wraps all pages so updates here effect everything */

import React from 'react'
import { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

// Bring in footer
import Footer from './sfc/footer'

// Styles
// Import any styles needed in document
import "../styles/fonts.less";
import "../styles/sfchronicle.less";
import "../styles/footer.less";
import "../styles/interactives.less";
import "../styles/project.less";

// Enable Font Awesome! 
import { library, config } from '@fortawesome/fontawesome-svg-core';
import { faChevronDown, faEnvelope} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
config.autoAddCss = true;
// For optimization we import the individual solids we use into the library 
library.add(faFacebook, faTwitter, faLinkedin, faInstagram, faChevronDown, faEnvelope);

// Bring in moment to handle dates
let moment = require('moment');

// Get data from config
let projectConfig = require("../../project-config.json");

//Determine if embedded
let embedded = false;
if (projectConfig.EMBEDDED === "true" || projectConfig.EMBEDDED === true){
  embedded = true;
}

// eslint-disable-next-line
var HDN = {};
if (!projectConfig.EMBEDDED){
  HDN = require("../data/sfc/HDN.js");
}

// Save current env
const env = process.env.GATSBY_DEPLOY_ENV;

class Layout extends Component {

  componentDidMount () {
    // To allow tweets to expand as popups
    require("../data/sfc/twitter_pop");
  }

  computerizeDates () {
    // Convert date to computer-readable time
    this.computerPubDate = moment(projectConfig.PROJECT.DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ");
    // Check safely for MOD_DATE
    if (typeof projectConfig.PROJECT.MOD_DATE !== "undefined"){
      this.computerModDate = moment(projectConfig.PROJECT.MOD_DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ");
    } else {
      // If MOD_DATE does not exist, set var to pubdate
      this.computerModDate = this.computerPubDate;
    }
  }

  render () {
    // Format dates
    this.computerizeDates();
    
    // Handle author data
    let authorObj = [];
    let newAuthor = {};
    try {
      for (let i = 0; i < this.props.authors.length; i++){
        newAuthor = {
          "@type": "Person",
          "name": this.props.authors[i].AUTHOR_NAME,
          "url": this.props.authors[i].AUTHOR_PAGE
        }
        authorObj.push(newAuthor);
      }
    } catch (err){
      // If it errored, just set to neutral default
      authorObj = {
        "@type": "Person",
        "name": "San Francisco Chronicle Staff",
        "url": "https://www.sfchronicle.com"
      }
    }

    return (
      <Fragment>
        {/* Forcing HDN vars in so we can feed them to ensighten */}
        <Helmet script={[{ 
          type: 'text/javascript', 
          innerHTML: `window.HDN = ${JSON.stringify(HDN.default)}` 
        }]} />
        <Helmet>
          <title>{this.props.title}</title> 
          <meta name="description" content={ this.props.description } />
          <meta name="__sync_contentCategory" content={ this.props.paywall } />
          <link rel="shortcut icon" href="https://www.sfchronicle.com/favicon.ico" type="image/x-icon" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ this.props.title } />
          <meta name="twitter:site" content="@sfchronicle" />
          <meta name="twitter:url" content={ this.props.url } />
          <meta name="twitter:image" content={ this.props.image } />
          <meta name="twitter:description" content={ this.props.description } />

          <meta property="og:type" content="article" />
          <meta property="og:title" content={ this.props.title } />
          <meta property="og:site_name" content="The San Francisco Chronicle" />
          <meta property="og:url" content={ this.props.url } />
          <meta property="og:image" content={ this.props.image } />
          <meta property="og:description" content={ this.props.description } />

          <script data-schema="NewsArticle" type="application/ld+json">{`{
            "@context": "http://schema.org",
            "@type": "NewsArticle",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "${this.props.url}"
            },
            "headline": "${this.props.title}",
            "image": {
              "@type": "ImageObject",
              "url": "${this.props.image}"
            },
            "datePublished": "${this.computerPubDate}",
            "dateModified": "${this.computerModDate}",
            "author": ${JSON.stringify(authorObj)},
            "publisher": {
              "@type": "Organization",
              "name": "San Francisco Chronicle",
              "logo": {
                "@type": "ImageObject",
                "url": "https://projects.sfchronicle.com/logos/schema_logo.jpg",
                "width": "600",
                "height": "60"
              }
            },
            "description": "${this.props.description}"
          }`}</script>

          {/* Only needed if this is an embed on some page */}
          { embedded && 
            <script src="https://projects.sfchronicle.com/shared/js/responsive-child.js"></script>
          } 

          {/* Add jQuery for treg to use ... sigh */}
          { (!embedded && env !== "app") &&
            <script src="https://projects.sfchronicle.com/shared/js/jquery.min.js"></script>
          }

          {/* Exclude login logic from embeds and the app */}
          { (!embedded && env !== "app") &&
            <script src="https://treg.hearstnp.com/treg.js"></script>
          }

          {/* Always include GA and Chartbeat */}
          <script src="https://nexus.ensighten.com/hearst/news/Bootstrap.js"></script>
          
          {/* Exclude subscribe logic from embeds and the app */}
          { (!embedded && env !== "app") &&
            <script src="https://cdn.blueconic.net/hearst.js"></script>
          }

        </Helmet>
        
        
        {/* Full project included here: */}
        {this.props.children}

        {/* Include footer unless it's embedded or the app version: */}
        { (!embedded && env !== "app") &&
          <Footer />
        }

        {/* Redirect to the app version if this is not app and we're on Richie */}
        { (!embedded && env !== "app") &&
          <script src="https://projects.sfchronicle.com/shared/js/app-redirect.js" async></script>
        }
      </Fragment>
    )
  }
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

Layout.defaultProps = {
  description: projectConfig.PROJECT.DESCRIPTION,
  paywall: projectConfig.PAYWALL,
  image: projectConfig.PROJECT.IMAGE,
  title: projectConfig.PROJECT.TITLE,
  url: `https://projects.sfchronicle.com/${ projectConfig.PROJECT.SUBFOLDER }/${ projectConfig.PROJECT.SLUG }/`,
  authors: projectConfig.PROJECT.AUTHORS
};

export default Layout;
