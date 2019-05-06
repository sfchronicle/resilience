import React from 'react';
import {geolocated} from 'react-geolocated';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 
class Geolocate extends React.Component {
  render() {
    return !this.props.isGeolocationAvailable
      ? <span>Cannot geolocate</span>
      : !this.props.isGeolocationEnabled
        ? <span>Enable geolocation</span>
        : this.props.coords
          ? <span>See your location</span>
          : <span>Searching <FontAwesomeIcon icon="globe" className="faa-tada animated" /></span>;
  }
}
 
export default geolocated({
  positionOptions: {
    enableHighAccuracy: false,
  },
  userDecisionTimeout: 10000,
})(Geolocate);