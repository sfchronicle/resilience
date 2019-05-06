
import React, { Component, Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import axios from 'axios'
import Geolocate from './geolocate'

// Handle dates
var moment = require('moment');

// Imports all images in the /images/ folder, accessible as an object
const images = (ctx => { 
  let keys = ctx.keys(); 
  let values = keys.map(ctx);
  return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {});
})(require.context('../images', true, /.*/));

if (typeof window !== 'undefined') {
	var L = require('leaflet');
} 
var {Map, TileLayer, Marker, Popup, Tooltip, GeoJSON, ImageOverlay} = require('react-leaflet');

var geodist = require('geodist')

export default class TrackerMap extends Component {
  constructor(props) {
    super(props)
    this.state = {
      zoom: 8,
      wipeMap: true, // The marker cluster glitch when swapping data, so we need to wipe them
      interact: true,
      mapCenter: [this.props.startLat, this.props.startLng],
      showFaults: false,
      geolocating: "",
      userPos: null,
      nearbyLanguage: "",
      layer: "fires", // What to show on map
      firesUrl: false,
      bounds: {_northEast: "", _southWest: ""}
    }

    this.map = React.createRef();
    this.interactPrompt = React.createRef();
    this.popImg = React.createRef();
    this.popup = React.createRef();
    this.currentVal = -1;
    this.interactTimeout = null;
    this.isMobile = false;
    this.maxMagnitude = 0;
    this.markerRefs = {};
    this.moving = false;

    // Create a ref for each marker
   	for (let quake in this.props.quakes){
   		this.markerRefs['marker' + quake] = React.createRef();
   	}

  }

  componentDidMount(){
  	if (window.innerWidth < 480){
  		this.setState({
  			lat: 37.951746,
  			lng: -120.6382447,
  			interact: false, // Prevent immediate interaction on mobile size
  		});

  		// Set mobile true flag
  		this.isMobile = true;

  	}

    // Wait for map to load to get size and bounds
    setTimeout(() => {
      let bounds = this.map.current.leafletElement.getBounds();
      let size = this.map.current.leafletElement.getSize();

      this.setState({
        bounds: bounds
      });

      this.preloadImage(bounds, size);
    }, 200);
    
  }

  handleShowFaults(){
  	// Reveal the fault layer
  	this.setState({
  		showFaults: true
  	})
  }

  handleHideFaults(){
  	// Just hide them
  	this.setState({
  		showFaults: false
  	})
  }

  convertDatesToAP (dateString) {
  	// Convert date string to AP style abbreviations
  	let newDateString = dateString;
  	newDateString = newDateString.replace('January', 'Jan.').replace('February', 'Feb.').replace('August', 'Aug.').replace('September', 'Sept.').replace('October', 'Oct.').replace('November','Nov.').replace('December','Dec.');
  	// Return the result
  	return newDateString;
  }

  freezeBody(innerElement){
  	// Save scrollTop value
		this.scroll = document.documentElement.scrollTop;
		if (!this.scroll && document.body.scrollTop){
			this.scroll = document.body.scrollTop;
		}

		// Scroll page to top
		document.documentElement.scrollTop = document.body.scrollTop = 0;

		// Disable
		document.body.classList.add("noscroll"); 
		const thisroot = document.querySelector('html');
		thisroot.classList.add("noscroll"); 
  }

  unfreezeBody(innerElement){
		// Enable
		document.body.classList.remove("noscroll"); 
		const thisroot = document.querySelector('html');
		thisroot.classList.remove("noscroll"); 

		// Scroll page to top
		document.documentElement.scrollTop = document.body.scrollTop = this.scroll;
  }

  panToQuake(lat, lng, keyIndex) {
  	if (this.moving){
  		// Refuse to act if we're in transit already
  		return false;
  	} else {
  		let thisMap = this.map.current.leafletElement;
  		if (Math.abs(thisMap.getCenter().lat - lat) > 0.01 && Math.abs(thisMap.getCenter().lng - lng) > 0.01){
  			this.moving = true;
  			// We need to pan the map -- do it
		    this.setState({
		  		mapCenter: [lat, lng]
		  	});
				// Waits until pan complete to open
		    setTimeout(() => {
		  		this.markerRefs['marker' + keyIndex].current.leafletElement.openPopup();
		  		// Allow next move
		  		this.moving = false;
		    }, 400);
  		} else {
  			// It's not far enough for a pan, just show the popup
  			this.markerRefs['marker' + keyIndex].current.leafletElement.openPopup();
	  		// Allow next move
	  		this.moving = false;
  		}
  	}
  }

  handleInteract(e){
  	e.preventDefault();
  	e.stopPropagation();
  	// Freeze scroll on mobile when map is fixed
  	if (!this.state.interact){
  		this.freezeBody(this.map);
  		// Remove interact prompt
  		this.interactPrompt.current.classList.remove('fade');
  	} else {
  		this.unfreezeBody(this.map);
  	}

  	// If this is mobile, send adjustment to parent too
  	if (this.isMobile){
  		this.props.adjustQuakeNav(!this.state.interact);
  	}

  	this.setState({
  		interact: !this.state.interact,
  	});
  }


  handleMapTouchStart(){
  	// Start touch check if it's not interactive
  	if (!this.state.interact && this.interactTimeout === null){
			this.interactTimeout = setTimeout(() => {
				// Cancel timer, took too long so it's not a touch
				this.interactTimeout = null;
			}, 200);
  	}
  }

  handleMapTouchEnd(){
  	// Extremely conditional prompt
  	if (
  		!this.state.interact && !this.state.zeroCases && !this.state.futureDate &&
  		this.interactTimeout !== null && this.interactPrompt.current.className.indexOf('fade') === -1
  	){
  		// Bring in the prompt!
  		this.interactPrompt.current.classList.add('fade');
  		
  		setTimeout(() => {
  			// Remove the prompt slowly
  			this.interactPrompt.current.classList.remove('fade');
  			this.interactTimeout = null;
  		}, 3000);
  	}
  }

  getStyle(feature, layer) {
    // Set style defaults
    let defaults = {
      // color: '#006400',
      weight: 5,
      opacity: 0.5,
      //fill: '#006400',
    }

    // Get magnitude if it exists
    let thisMagnitude = feature.properties.value;
    console.log(thisMagnitude, feature);
    // If a match is found, make the variable simple
    if (thisMagnitude){
      // Set className by magnitude (the CSS classes handle most of the visual work)
      defaults['className'] = "quake-contour color_mag_" + (thisMagnitude*2) + " magnitude_anim_" + ((this.maxMagnitude - thisMagnitude + 1)*2);
    }

    return defaults;
  }

  // We need to preload or else the bounds will be wonky for a sec
  preloadImage(bounds, size){
    const img = new Image();
    img.src = 'http://egis.fire.ca.gov/arcgis/rest/services/FRAP/FHSZ/MapServer/export?dpi=96&transparent=true&format=png32&bbox='+bounds._northEast.lng+'%2C'+bounds._northEast.lat+'%2C'+bounds._southWest.lng+'%2C'+bounds._southWest.lat+'&bboxSR=4326&imageSR=4326&size='+size.x+'%2C'+size.y*0.8+'&f=image';
    img.onload = () => {
      this.setState({
        firesUrl: img.src
      });
    }
  }

  onZoomEvent(data){
    // Set bounds in case we have fire map open
    let bounds = data.target.getBounds();
    let size = data.target.getSize();

    this.preloadImage(bounds, size);

    this.setState({
      zoom: data.target._zoom,
      bounds: bounds,
      firesUrl: false
    });
  }

  // After drag, we need to update the state so it's all in sync
  onDragEvent(data){
    // Set bounds in case we have fire map open
    let bounds = data.target.getBounds();
    let size = data.target.getSize();

    this.preloadImage(bounds, size);

  	let newCenter = data.target.getCenter();
		this.setState({
  		mapCenter: [newCenter.lat, newCenter.lng],
      bounds: bounds,
      firesUrl: false
  	});
  }

  trackError(error){
  	//console.log(error);
  }

  setLayer(type){
    // Set type of layer for map
    this.setState({
      layer: type
    });
  }

  getUserPosition(position){
    let userLat = position.coords.latitude;
    let userLng = position.coords.longitude;
    // Create ref for user pos
    this.markerRefs["markerme"] = React.createRef();
    // Compare distances
    let nearbyQuakes = 0;
    let maxDistance = 10;
    let additionalLanguage = "";
    this.props.quakes.forEach((item) => {
		  let distance = geodist({lat:userLat, lon:userLng}, {lat:item.lat, lon:item.long});
		  //If distance is closer than max, add it to nearby quakes
		  if (distance < maxDistance){
		  	nearbyQuakes++;
		  	// Surface first nearby quake within the hour
		  	if (!additionalLanguage && moment(item.time).isAfter(moment().subtract(1, "hours"))){
		  		additionalLanguage = " You might have felt the quake at <strong>" + moment(item.time).format("h:mm A").replace("AM", "a.m.").replace("PM", "p.m.") + " " + item.prox_place + "</strong>. Consider filing a <a href='https://earthquake.usgs.gov/earthquakes/eventpage/"+item.id+"/tellus' target='_blank' rel='noopener noreferrer'>Did You Feel It report</a> with USGS."
		  	}
		  }
		});

		let quakeLanguage = "There have been <strong>" + nearbyQuakes + " quakes</strong> within " + maxDistance + " miles of your location in the last 30 days.";
		if (nearbyQuakes === 1){
			quakeLanguage = "There has been <strong>" + nearbyQuakes + " quake</strong> within " + maxDistance + " miles of your location in the last 30 days.";
		}

		// Tack on super recent nearby quake if there was one
		quakeLanguage += additionalLanguage;

    // Set state with user position
    this.setState({
    	userPos: [userLat, userLng],
    	nearbyLanguage: quakeLanguage
    });

    // Pan the map over to the new point
    this.panToQuake(userLat, userLng, "me");
  }

  handleGeolocate(){
  	// Start the search
  	this.setState({
  		geolocating: "searching"
  	})
  }

  handleRelocate(){
  	// Pan the map over to the new point (if we have the right state)
  	let userPos = this.state.userPos;
  	if (userPos){
  		this.panToQuake(userPos[0], userPos[1], "me");
  		this.setState({
  			mapCenter: [userPos[0], userPos[1]]
  		});
  	}
  }

	render () {

    if (typeof window !== 'undefined') {

		  // Only allow mobile map to be fixed and only if we're interacting with it
		  let wrapperClass = "map-wrapper";
		  if (this.isMobile && this.state.interact){
		  	wrapperClass += " fixed";
		  }

		  // Get window height to accomodate weird mobile things
		  let windowHeight = window.innerHeight;

      if (this.isMobile){
        windowHeight -= 100;
      }
		  
			return (
				<div id="tracker-outer">
					<div className={wrapperClass} style={{height:windowHeight}}>
					
						<div className="counter-wrapper">
							<div className="legend">
								{/* this.state.geolocating === "" ? (
									<div className="map-control" onClick={this.handleGeolocate.bind(this)}>
										<span>Quakes near me</span>
									</div>
								) : (
									<div className={this.state.userPos ? "map-control active" : "map-control"} onClick={this.handleRelocate.bind(this)}>
										<Geolocate onSuccess={(position) => this.getUserPosition(position)} onError={(error) => this.trackError(error)}  />
									</div>
								)*/}
                {/*
								{ !this.state.showFaults ? (
									<div className="map-control" onClick={this.handleShowFaults.bind(this)}>
										<span>Show fault lines</span>
									</div>
								) : (
									<div className="map-control active" onClick={this.handleHideFaults.bind(this)}>
										<span>Hide fault lines</span>
									</div>
								)}
                */}
								<div className="icon-key">
									Show danger zones for
								</div>
                <div className="option-box">
                  <div className={this.state.layer == "fires" ? "option active" : "option"} onClick={(type) => this.setLayer("fires")}>Fires</div>
                  <div className={this.state.layer == "quakes" ? "option active" : "option"} onClick={(type) => this.setLayer("quakes")}>Quakes</div>
                  <div className={this.state.layer == "floods" ? "option active" : "option"} onClick={(type) => this.setLayer("floods")}>Floods</div>
                  <div className={this.state.layer == "landslides" ? "option active" : "option"} onClick={(type) => this.setLayer("landslides")}>Landslides</div>
                </div>
                {/*
								<div className="gradient-key">
									<span className="first-key">3</span>
									<div className="circle circle3"></div>
									<div className="circle circle4"></div>
									<div className="circle circle5"></div>
									<div className="circle circle6"></div>
									<div className="circle circleMax"></div>
									<span className="last-key">7+</span>
								</div>
                */}
							</div>
						</div>

						<div className="interact-wrapper" onTouchStart={this.handleMapTouchStart.bind(this)} onTouchEnd={this.handleMapTouchEnd.bind(this)}>
							<div className={this.state.interact ? "icon-box active" : "icon-box"} onTouchEnd={(e) => this.handleInteract(e)}>
								{	this.state.interact ? (
									<Fragment>
										<FontAwesomeIcon icon="times" />
										<span>Return</span>
									</Fragment>
								) : (
									<Fragment>
										<FontAwesomeIcon icon="hand-pointer" />
										<span>Interact</span>
									</Fragment>
								)}
							</div>
						</div>

						<div ref={this.interactPrompt} className="overlay interact-prompt">
							<div className="overlay-inner">
								<p>Click the "Interact" button to use this map.</p>
							</div>
						</div>

			      <Map boxZoom={false} keyboard={false} touchZoom={this.state.interact} dragging={this.state.interact} scrollWheelZoom={false} center={this.state.mapCenter} zoom={this.state.zoom} maxZoom={17} minZoom={2} ref={this.map} onZoomend={this.onZoomEvent.bind(this)} onDragend={this.onDragEvent.bind(this)}>
			        <TileLayer
			          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
			          url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
			        />
              {(this.state.zoom < 11 && this.state.showFaults) &&
                <TileLayer
                  //url='https://earthquake.usgs.gov/arcgis/rest/services/eq/map_faults/MapServer/tile/{z}/{y}/{x}/'
                  url='https://earthquake.usgs.gov/arcgis/rest/services/haz/hazfaults2014/MapServer/tile/{z}/{y}/{x}/'
                />
              }

              {(this.state.layer == "fires" && this.state.firesUrl) &&
                <ImageOverlay 
                className="fire-image"
                url={this.state.firesUrl}
                bounds={[[this.state.bounds._northEast.lat,this.state.bounds._northEast.lng], [this.state.bounds._southWest.lat,this.state.bounds._southWest.lng]]}
              />

              }

              {(this.state.layer == "quakes") &&
                <TileLayer
                  url='https://spatialservices.conservation.ca.gov/arcgis/rest/services/CGS_Earthquake_Hazard_Zones/SHP_Liquefaction_Zones/MapServer/tile/{z}/{y}/{x}/'
                />
              }
              {(this.state.layer == "quakes") &&
                <TileLayer
                  //url='https://earthquake.usgs.gov/arcgis/rest/services/eq/map_faults/MapServer/tile/{z}/{y}/{x}/'
                  url='https://earthquake.usgs.gov/arcgis/rest/services/haz/hazfaults2014/MapServer/tile/{z}/{y}/{x}/'
                />
              }

              {(this.state.layer == "floods") &&
                <TileLayer
                  url='https://earthquake.usgs.gov/arcgis/rest/services/haz/hazfaults2014/MapServer/tile/{z}/{y}/{x}/'
                />
              }

              {(this.state.layer == "landslides") &&
                <TileLayer
                  url='https://spatialservices.conservation.ca.gov/arcgis/rest/services/CGS/LandslideInventory_DC1_Younger/MapServer/tile/{z}/{y}/{x}/'
                />
              }

							{this.state.userPos &&
								<Marker position={this.state.userPos} ref={this.markerRefs['markerme']}>
			            <Popup autoPan={false} offset={[0, -10]}>
			            	<div className="quake-near-results" dangerouslySetInnerHTML={{__html: this.state.nearbyLanguage}}>
			            	</div>
			            </Popup>
			          </Marker>
							}

			      </Map>
			    </div>
			  </div>
			)
		} else {
			return (
				<div id="tracker-outer">
					{/* 
						Returning an empty div on purpose so the div order doesn't glitch out 
						NOTE: This is necessary for any element that has the (typeof window !== 'undefined') catch
						and requires both returns to be wrapped in an empty div
					*/}
				</div>
			)
		}
	}
}
