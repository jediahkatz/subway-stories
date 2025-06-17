import React from 'react';

const CreditsModal = ({ showAboutView, toggleAboutView }) => {
  if (!showAboutView) return null;

  return (
    <div className="about-view">
      <div className="about-content">
        <h1>Subway Stories</h1>
        <p>
          Subway Stories is an interactive data visualization that explores NYC subway ridership patterns 
          through engaging narratives and real-time data. Created for the MTA Open Data Challenge 2024, 
          this project transforms raw transit data into compelling stories about how New Yorkers move 
          through their city.
        </p>
        <p>
          Discover the hidden patterns in subway usage - from rush hour flows to weekend adventures, 
          from seasonal changes to the unique character of each station. Each story reveals a different 
          facet of the vibrant, ever-moving tapestry that is New York City's subway system.
        </p>

        <div className="faq">
          <h4>Frequently Asked Questions</h4>
          
          <h5>What data does this visualization use?</h5>
          <p>
            The visualization uses MTA turnstile data and GTFS feeds to show real ridership patterns 
            across the NYC subway system. The data is processed to show arrivals and departures at 
            each station by hour, day, and month.
          </p>

          <h5>How do I interact with the visualization?</h5>
          <p>
            Use the control panel on the left to select different stations, times, and viewing options. 
            In Stories mode, scroll through the narrative to explore different aspects of subway ridership. 
            In Visualization mode, customize the data view with various filters and display options.
          </p>

          <h5>What do the height and colors of the bars represent?</h5>
          <p>
            Bar heights represent ridership volume - taller bars indicate more passengers. Colors represent 
            ridership intensity on a scale from low (brown) to high (red). You can toggle between absolute 
            numbers and percentages, and adjust the scale manually or use auto-scaling.
          </p>

          <h5>Can I switch between 2D and 3D views?</h5>
          <p>
            Yes! Use the 3D toggle button in the bottom left to switch perspectives. The 3D view provides 
            a different spatial understanding of the data, while 2D mode offers clearer readability.
          </p>
        </div>

        <div className="credits">
          <h4>Credits</h4>
          <p>Created for the MTA Open Data Challenge 2024</p>
          <p>Data source: Metropolitan Transportation Authority (MTA)</p>
          <p>Visualization: Built with React, Deck.GL, and Mapbox</p>
          <p>Design: Interactive storytelling meets transit data</p>
        </div>
      </div>
      <button className="close-about-view" onClick={toggleAboutView}>
        ×
      </button>
    </div>
  );
};

export default CreditsModal;