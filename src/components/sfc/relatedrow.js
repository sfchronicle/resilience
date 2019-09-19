
import React, { Component, Fragment } from "react";
import RelatedLink from './relatedlink';

class RelatedRow extends Component {
  render() {
    const links = this.props.links;
    const linkWidth = 100/links.length;

    return (
      <Fragment>
        <h2>How to prepare for disaster</h2>
        <div className="related-links">
          { links.map((link) => {
            return <RelatedLink key={link.title} url={link.url} image={link.image} title={link.title} width={linkWidth} />
          })}
        </div>
      </Fragment>
    );
  }
}
export default RelatedRow;

    
