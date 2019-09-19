
import React, { Component, Fragment } from "react";
import LazyLoad from "react-lazyload";

// Given a WCMID, this will create an image at the correct size for the viewport and lazyload it
export default class WCMImage extends Component {
  constructor(props){
    super(props);
    // Get width of parent to properly size img
    this.imageWrapper = React.createRef(); 
    this.state = {
      imageSize: 400
    };
  }
  
  componentDidMount(){
    // Set screen size factoring in retina screens
    let newVal = this.imageWrapper.current.offsetWidth * this.screenRezMultipler();
    // Stop at max rez
    if (newVal > 2048){
      newVal = 2048;
    }
    // Update the state
    this.setState({
      imageSize: Math.round(newVal)
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
    const props = this.props;
    const imageString = "https://s.hdnux.com/photos/0/0/0/"+this.props.WCMID+"/0/"+this.state.imageSize+"x0.jpg";
    // Center as bg default
    let thisPosition = props.position;
    if (!props.position) {
      thisPosition = "center";
    }
    const bgStyleObj = {backgroundImage: "url("+imageString+")", backgroundSize: "cover", height: props.height, backgroundPosition: thisPosition};

    return (
      <div className="wcm-image-wrapper" ref={this.imageWrapper}>
        {props.lazy === false ? (
          <LazyLoad once>
            {props.background === true ? (
              <div className="wcm-bg-image" style={bgStyleObj}></div>
            ) : (
              <img src={imageString} alt={props.alt} />
            )}
          </LazyLoad>
        ) : (
          <Fragment>
            {props.background === true ? (
              <div className="wcm-bg-image" style={bgStyleObj}></div>
            ) : (
              <img src={imageString} alt={props.alt} />
            )}
          </Fragment>
        )}
      </div>
    )
  }
}
