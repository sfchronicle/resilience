
import React, { Component, Fragment } from "react";

class Byline extends Component {
  render() {
    let prefix = " ";
    // Add necessary spacing and grammar
    if (this.props.index > 0){
      prefix = ", ";

      if (this.props.is_last){
        prefix = " and ";
      }
    }

    return (
      <Fragment>
      	{ (this.props.url) ? (
            <Fragment>
              {prefix}
              <span>{this.props.name}</span>
            </Fragment>
        	) : (
        		<span>{prefix}{this.props.name}</span>
        	)
        }
      </Fragment>
    );
  }
}
export default Byline;

		
