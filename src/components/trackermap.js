
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
var {Map, TileLayer, ImageOverlay, Pane} = require('react-leaflet');

var faultsSVG = require("../data/sfc/historical_faults.svg");

export default class TrackerMap extends Component {
  constructor(props) {
    super(props)
    this.state = {
      zoom: 8,
      wipeMap: true, // The marker cluster glitch when swapping data, so we need to wipe them
      interact: true,
      mapCenter: [this.props.startLat, this.props.startLng],
      legendOpen: false,
      nearbyLanguage: "",
      firesUrl: false,
      bounds: {_northEast: "", _southWest: ""}
    }

    this.map = React.createRef();
    this.interactPrompt = React.createRef();
    this.interactTimeout = null;
    this.isMobile = false;
    this.moving = false;

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

  
  // We need to preload or else the bounds will be wonky for a sec
  preloadImage(bounds, size){
    const img = new Image();
    img.src = 'http://egis.fire.ca.gov/arcgis/rest/services/FRAP/FHSZ/MapServer/export?dpi=96&transparent=true&format=png32&bbox='+bounds._northEast.lng+'%2C'+bounds._northEast.lat+'%2C'+bounds._southWest.lng+'%2C'+bounds._southWest.lat+'&bboxSR=4326&imageSR=102100&size='+size.x+'%2C'+size.y+'&f=image';
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
    this.props.setLayer(type);
  }

	render () {

    if (typeof window !== 'undefined') {

		  // Only allow mobile map to be fixed and only if we're interacting with it
		  let wrapperClass = "map-wrapper";
		  if (this.isMobile && this.state.interact){
		  	wrapperClass += " fixed";
		  }
		  
			return (
				<div id="tracker-outer">
					<div className={wrapperClass}>
					
						<div className="counter-wrapper">
							<div className="actions">
								<div className="icon-key">
									Show danger zones for
								</div>
                <div className="option-box">
                  <div className={this.props.chosenLayer === "fires" ? "option active" : "option"} onClick={(type) => this.setLayer("fires")}>Fires</div>
                  <div className={this.props.chosenLayer === "quakes" ? "option active" : "option"} onClick={(type) => this.setLayer("quakes")}>Quakes</div>
                  <div className={this.props.chosenLayer === "floods" ? "option active" : "option"} onClick={(type) => this.setLayer("floods")}>Floods</div>
                </div>
							</div>
              <div className="key" onClick={() => {
                this.setState({
                  legendOpen: true
                });
              }}>
                <FontAwesomeIcon icon="hand-pointer" /> Show legend
              </div>
						</div>

            {this.state.legendOpen &&
              <div className="legend" onClick={(e) => {
                  this.setState({
                    legendOpen: false
                  });
                }}>
                <div className="legend-box" onClick={(e) => {
                  e.stopPropagation();
                }}>
                  <div className="legend-close" onClick={() => {
                    this.setState({
                      legendOpen: false
                    });
                  }}><FontAwesomeIcon icon="times" /></div>
                  {this.props.chosenLayer === "quakes" &&
                    <p>Most of the Bay Area is at risk for a major earthquake. The <span className="red">red lines</span> on this map represent the fault lines that have seen evidence of seismic activity in the past 150 years and are likely to cause another earthquake. Areas <span className="green">highlighted in green</span> have been designated by the California Geological Survey as liquefaction zones. They are at increased risk for shaking and structural damage during an earthquake.</p>
                  }
                  {this.props.chosenLayer === "fires" &&
                    <p>Cal Fire ranks areas of California by Fire Hazard Severity Zones (FHSZ) based on fuels, weather conditions, terrain and potential damage to buildings and infrastructure. The <span className="darkred">darkest red</span> are very high FHSZ that fall under local jurisdiction. The other colors represent <span className="lightred">very high</span>, <span className="orange">high</span> and <span className="yellow">moderate</span> FHSZ that are under state control.</p>
                  }
                  {this.props.chosenLayer === "floods" &&
                    <p>This map shows NOAA's Coastal Flood Hazard Composite rating, which scales from <span className="heavyflood">most impacted</span> to <span className="lightflood">least impacted</span>. The composite data includes risks of high tide flooding, annual flooding, sea level rise scenarios and tsunami run-up zones. The gray areas have not yet been assessed.</p>
                  }
                </div>
              </div>
            }
            

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
			          url='https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
			        />

              {(this.props.chosenLayer == "fires" && this.state.firesUrl) &&
                <Pane name="fires">
                  <ImageOverlay 
                    className="fire-image"
                    url={this.state.firesUrl}
                    bounds={[[this.state.bounds._northEast.lat,this.state.bounds._northEast.lng], [this.state.bounds._southWest.lat,this.state.bounds._southWest.lng]]}
                  />
                  <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url='https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'
                  />
                </Pane>

              }

              {(this.props.chosenLayer == "quakes") &&
                <Pane name="quakes">
                  <TileLayer
                    opacity={0.65}
                    url='https://spatialservices.conservation.ca.gov/arcgis/rest/services/CGS_Earthquake_Hazard_Zones/SHP_Liquefaction_Zones/MapServer/tile/{z}/{y}/{x}/'
                  />
                  {/*
                  <TileLayer
                    //url='https://earthquake.usgs.gov/arcgis/rest/services/eq/map_faults/MapServer/tile/{z}/{y}/{x}/'
                    url='https://earthquake.usgs.gov/arcgis/rest/services/haz/hazfaults2014/MapServer/tile/{z}/{y}/{x}/'
                  />
                  */}
                  <ImageOverlay 
                    className="fault-image"
                    url={faultsSVG}
                    bounds={[[45.45007611900008,-108.7211835399999], [ 29.65238198900004,-124.490694]]}
                  />
                  <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url='https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'
                  />
                </Pane>
              }

              {(this.props.chosenLayer == "floods") &&
                <Pane name="floods">
                  <TileLayer 
                    opacity={0.65}
                    url='https://coast.noaa.gov/arcgis/rest/services/FloodExposureMapper/CFEM_CoastalFloodHazardComposite/MapServer/tile/{z}/{y}/{x}'
                  />
                  <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url='https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'
                  />
                </Pane>
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
