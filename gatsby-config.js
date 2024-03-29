
//Set get the current env var
const currentEnv = process.env.GATSBY_DEPLOY_ENV;
console.log("Current environment: " + currentEnv);

// Get data from config
let projectConfig = require("./project-config.json");

// Set the path prefix for the given deploy (ignored for dev)
let pathPrefix = "/test-proj/" + projectConfig.PROJECT.SLUG;
if (currentEnv == "app"){
  pathPrefix = "/app/" + projectConfig.PROJECT.SLUG;
}
if (currentEnv == "production"){
  pathPrefix = "/" + projectConfig.PROJECT.SUBFOLDER + "/" + projectConfig.PROJECT.SLUG;
}

module.exports = {
  siteMetadata: projectConfig,
  pathPrefix: pathPrefix,
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    'gatsby-plugin-react-leaflet',
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.app/offline
    // 'gatsby-plugin-offline',
    // Non default plugins go here:
    'gatsby-plugin-less'
  ],
}
