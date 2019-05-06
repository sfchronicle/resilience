
import React, { Component } from "react";

class RelatedLink extends Component {
  render() {
    return (
      <div className="link-block">
				<a href={ this.props.url }>
					<img src={ this.props.image } alt={this.props.title} />
					<h4>{ this.props.title }</h4>
				</a>
				<style>{`
	      .link-block {
	        flex: 0 0 ${this.props.width}%;
	      }
	    	`}</style>
			</div>
    );
  }
}
export default RelatedLink;

		
