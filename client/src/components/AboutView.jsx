export default function AboutView({ toggleAboutView }) {
    return (
        <div className="about-view">
            <button className="close-about-view" onClick={toggleAboutView}>×</button>
            <div className="about-content">
            <h1>Subway Stories</h1>

            <p>
                New York City is alive. The lifeblood of this city is the eight million people who call it home, and the subway is its veins. Every day, nearly four million souls are ferried through the system—as much as the entire population of Los Angeles. More than just transportation, the subway is a portal to the city's neighborhoods and a microcosm of its diversity and vibrancy. It's a place where dark-suited bankers, gruff construction workers, expectant mothers, and backflipping performers all rub shoulders.
            </p>

            <p>
                We created <i>Subway Stories</i> for the 2024 MTA Open Data Challenge to help everyone explore and understand the city's ridership patterns. The visualization tab (top right) lets you dive into the data yourself after reading through our stories about how New Yorkers move through their city. We encourage you to share your own stories with us through <a href="https://forms.gle/HDZ6npr3uLaqivZe7" target="blank">this form</a>!
            </p>

            <p>
                Our analysis uses the MTA's Subway Origin-Destination Ridership dataset, which estimates how many people travel between any two stations. While the MTA can't directly track exits, they make educated guesses about destinations by looking at where riders start their next trip. You can filter the data by time, day, and month to understand how ridership shifts with work schedules, events, and neighborhood patterns. We used the complete 2023 dataset rather than the in-progress 2024 numbers to ensure we captured full yearly trends.
            </p>

            <div className="credits">
                <h4>Proudly brought to you by this New York-based team:</h4>
                <p>Jediah Katz (Development, Data Analysis, Design & Reporting)</p>
                <p>Julia Han (Design)</p>
                <p>Marc Zitelli (Data Analysis & Reporting)</p>

                <h4>Special thanks to:</h4>
                <p>Carly Ayres, Christina Lu, Michael Donnelly, Ricky Grullon, Tyler Hutton</p>
                <p>Anna Li, Becca Foley, Eitan Darwish, Michael Kwan, Rahmn</p>

                <h4>Inspired by the work of:</h4>
                <p>Justin Fung, Matt Yarri, Julia Lynn, Joshua Pekera</p>
            </div>

            <div className="faq">
                <h4>FAQ</h4>
                <h5>What does 8:00 a.m. mean in the data?</h5>
                <p>
                    This refers to all riders who entered their origin station between 8:00 a.m. and 8:59 a.m. and doesn't account for travel time.
                </p>
                <h5>Why can't I pick specific dates?</h5>
                <p>
                    The MTA's data is averaged over the month to protect the anonymity of riders. However, for large events like the US Open, the impact on ridership is significant enough to bring up the monthly average.
                </p>
                <h5>
                    Are these numbers exact?
                </h5>
                <p>
                    No, these numbers are estimates based on the MTA's modeling assumptions. For more on how they're calculated, see this <a href="https://new.mta.info/article/introducing-subway-origin-destination-ridership-dataset" target='blank'>blog post</a> from the MTA.
                </p>
                <h5>What does "Arriving at" and "Departing from" mean?</h5>
                <p>
                    These refer to the direction of travel. For example, if you've selected "Arriving at Fulton St," the visualization displays the estimated number of riders who entered any other station and then exited at Fulton St. If you've selected "Departing from Fulton St," the visualization shows the estimated number of riders who exited from any other station after beginning their trip at Fulton St.
                </p>
                <h5>How does the "Bar scale" setting work?</h5>
                <p>
                    Since some stations have many more riders than others, this option allows changing the height of the bars to make the smaller numbers more visible. When "Auto" is displayed, we automatically adjust the scale based on the maximum ridership across the 24 hours. When the lock icon is displayed, the scale remains fixed—this is useful if you'd like to compare the data for different days, months, or stations.
                </p>
            </div>
        </div>  
    </div>
    )
}