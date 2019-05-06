
import React, { Component } from "react";
import LazyLoad from "react-lazyload";

// Given a WCMID, this will create an image at the correct size for the viewport and lazyload it
export default class WCMImage extends Component {
  constructor(props){
    super(props);
    // Get width of parent to properly size img
    this.imageWrapper = React.createRef(); 
    this.state = {
      imageSize: 600
    };
  }
  
  componentDidMount(){
    // Set screen size factoring in retina screens
    this.setState({
      imageSize: Math.round(this.imageWrapper.current.offsetWidth * this.screenRezMultipler())
    });  
  }


  screenRezMultipler() {
    // If this isn't implemented or it's 1, just return 1
    if (window.devicePixelRatio && window.devicePixelRatio > 1){
      return window.devicePixelRatio;
    }
    return 1;
  }

  render() {
    // Load images right away if needed (above the fold)
    if (this.props.lazy === false){
      return (
        <div className="wcm-image-wrapper" ref={this.imageWrapper}>
          <img src={"https://s.hdnux.com/photos/0/0/0/"+this.props.WCMID+"/0/"+this.state.imageSize+"x0.jpg"} />
        </div>
      );
    } else {
      return (
        <div className="wcm-image-wrapper" ref={this.imageWrapper}>
          <LazyLoad once>
            <img src={"https://s.hdnux.com/photos/0/0/0/"+this.props.WCMID+"/0/"+this.state.imageSize+"x0.jpg"} />
          </LazyLoad>
        </div>
      );
    }
  }
}
