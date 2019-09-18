import React, { PureComponent } from 'react';
import LazyLoad from 'react-lazyload';

let Parser = require('./sfc/rss/parser');
let parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: false}],
    ]
  }
});

export default class RecentNews extends PureComponent {
  constructor() {
    super()
    this.state = {
      entries: [],
      expanded: true
    }
  }

  componentDidMount(){
    // Parse stories out of feed
    parser.parseURL('https://www.sfchronicle.com/default/feed/earthquake-tracker-recirculation-feed-2323.php', (err, feed) => {
      if (feed){
        this.setState({
          entries: feed.items.slice(0, 3)
        });
      }
    })
  }

  render(){
    // Don't show if we don't have data yet (or if it's been collapsed)
    if (this.state.entries.length === 0 || !this.state.expanded){
      return false;
    } else {
      // Render latest news items
      return (
        <div className="recent-news-wrapper">
  
          <h2 className="related-title">More about each risk</h2>

          <div className="related-items">
    
            { this.state.entries.map((recentItem, index) => {           
  
             
              // check if article contains image
              if (recentItem['media:content']){
                 // Swap the high res image out for a small one
                let imgURL = recentItem['media:content']['$']['url'];
                imgURL = imgURL.replace("rawImage", "ratio3x2_575.jpg");

                return (
                  <div className="recent-item" key={"recent" + index} >
                    <a href={recentItem.link}>
                      <LazyLoad height={20} once>
                        <img src={imgURL} alt={recentItem.title} />
                      </LazyLoad>
                      <label>{recentItem.title}</label>
                    </a>
                  </div>
                )
              } else {
                
                return(
                  // saving this for later
                  // if (recentItem.content.match(/<p>(.*?)<\/p>/)){
                  //   return abstract = recentItem.content.match(/<p>(.*?)<\/p>/)[0];
                  // }
                  <div className="recent-item no-image" key={"recent" + index}>
                    <a href={recentItem.link}>
                      <label>{recentItem.title}</label>
                      <div className="related-deck">{}</div>
                    </a>
                  </div>
                )
              }
              
            })}
          </div>
        </div>
      )
    }
  }
};