import React, { PureComponent } from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'

export default class SecondPage extends PureComponent {

	handleClick(e){
		alert("Templates are great!");
	}

	render(){
		return (
			<Layout>
		    <h1>Hi from the second page</h1>
		    <p>Welcome to page 2</p>
		    <Link to="/">Go back to the homepage</Link>

		    {/* Example of React conditional rendering */}
				{ (true) &&
					<p>This text was rendered based on a condition!</p>
				}

				{/* Example of React ternary rendering */}
				{ (true) ? (
					<p>This text will render if the condition is true!</p>
				) : (
					<p>This text will render if the condition is false!</p>
				)}

				{/* map() rendering example */}
				{ [{fruit: "apple"}, {fruit: "orange"}].map((item) => {
					console.log("Logging item!", item);
		      return <p key={item.fruit}>{item.fruit}</p>
				})}

				{/* Basic use of events in React */}
				<div>
					<button id="example-button" onClick={(e) => this.handleClick(e)}>Press me!</button>
				</div>

		  </Layout>
		)
	}
}

