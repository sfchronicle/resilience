
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
import { faChevronDown, faEnvelope, faClock, faTimes, faHandPointer, faGlobe} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
config.autoAddCss = true;
// For optimization we import the individual solids we use into the library 
library.add(faFacebook, faTwitter, faLinkedin, faInstagram, faChevronDown, faEnvelope, faClock, faTimes, faHandPointer, faGlobe);

// Bring in moment to handle dates
let moment = require('moment');

// Get data from config
let projectConfig = require("../../project-config.json");
let project = projectConfig.PROJECT;

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
    this.computerPubDate = moment(project.DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ");
    // Check safely for MOD_DATE
    if (project.MOD_DATE){
      this.computerModDate = moment(project.MOD_DATE, "MMMM D, YYYY h:mm a").format("YYYY-MM-DDTHH:mm:ssZ");
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
        <Helmet htmlAttributes={{
          lang: 'en',
        }} />
        {/* Forcing HDN vars in so we can feed them to ensighten */}
        <Helmet script={[{ 
          type: 'text/javascript', 
          innerHTML: `window.HDN = ${JSON.stringify(HDN.default)}` 
        }]} />
        <Helmet>
          <title>{this.props.title}</title> 
          <meta name="description" content={ this.props.description } />

          <link rel="shortcut icon" href="https://www.sfchronicle.com/favicon.ico" type="image/x-icon" />
          <link rel="canonical" href={ this.props.url } />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ this.props.social_title } />
          <meta name="twitter:site" content="@sfchronicle" />
          <meta name="twitter:url" content={ this.props.url } />
          <meta name="twitter:image" content={ this.props.image } />
          <meta name="twitter:description" content={ this.props.description } />

          <meta property="og:type" content="article" />
          <meta property="og:title" content={ this.props.social_title } />
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
          
          {/* Need jQuery for treg */}
          { env !== "app" && 
            <script src="https://projects.sfchronicle.com/shared/js/jquery.min.js"></script>
          } 

          {/* Only needed if this is an embed on some page */}
          { projectConfig.EMBEDDED && 
            <script src="https://projects.sfchronicle.com/shared/js/responsive-child.js"></script>
          } 

          {/* Exclude login logic from the app */}
          { env !== "app" &&
            <script src="https://treg.hearstnp.com/treg.js"></script>
          }

          {/* Always include GA and Chartbeat */}
          <script src="https://nexus.ensighten.com/hearst/news/Bootstrap.js"></script>
          
          {/* Exclude subscribe logic from the app */}
          { env !== "app" &&
            <script src="https://cdn.blueconic.net/hearst.js"></script>
          }

          {/* Add the app swap script */}
          { env !== "app" &&
            <script src="https://projects.sfchronicle.com/shared/js/app-redirect.js"></script>
          }

        </Helmet>
        
        
        {/* Full project included here: */}
        {this.props.children}

        {/* Include footer unless it's embedded or the app version: */}
        { (!projectConfig.EMBEDDED && env !== "app") &&
          <Footer />
        }
      </Fragment>
    )
  }
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

Layout.defaultProps = {
  description: project.DESCRIPTION,
  paywall: projectConfig.PAYWALL,
  image: project.IMAGE,
  title: project.SEO_TITLE,
  social_title: project.SOCIAL_TITLE,
  url: `https://projects.sfchronicle.com/${ project.SUBFOLDER }/${ project.SLUG }/`,
  authors: project.AUTHORS
};

export default Layout;
