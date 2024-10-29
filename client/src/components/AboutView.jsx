export default function AboutView({ toggleAboutView }) {
    return (
        <div className="about-view">
            <button className="close-about-view" onClick={toggleAboutView}>×</button>
            <div className="about-content">
            <h1>Subway Stories</h1>

            <p>
                New York City is alive. The lifeblood of this city is the eight million people who call it home, and the subway is its veins. Every day, nearly four million souls are ferried through the system—as much as the entire population of Los Angeles. More than just transportation, the subway is a portal to the city's neighborhoods and a microcosm of its diversity and vibrancy. It's a place where dark-suited bankers, gruff construction workers, expectant mothers, and backflipping street performers all rub shoulders.
            </p>

            <p>
                <i>Subway Stories</i> was created for the 2024 MTA Open Data Challenge. Our goal was to make it more accessible and engaging for anyone to dive into the subway's ridership data, while using it to spotlight some of the fascinating ways that New Yorkers work, play, and stay connected. After you've read through our stories and have a sense of how the data can be explored, we invite you to uncover your own stories by selecting the visualization tab on the top right.
            </p>

            <p>
                Our project is built on the MTA's <a href="https://new.mta.info/article/introducing-subway-origin-destination-ridership-dataset" target='blank'>Subway Origin-Destination Ridership dataset</a>, which estimates the number of subway riders traveling between any pair of stations. Although the MTA doesn't track when passengers exit the system, they can guess (imperfectly) where riders went by assuming that their next trip is from the same station. The dataset can be filtered by time of day, day of the week, and month, allowing for deep insights into how the city moves based on workday patterns, events, and community demographics. Though the 2024 dataset is being continuously updated, we used the 2023 dataset so that we would have data for the entire calendar year. 
            </p>

            <div className="credits">
                <h4>Proudly brought to you by this New York-based team:</h4>
                <p>Jediah Katz (Development, Data Analysis, Design & Reporting)</p>
                <p>Julia Han (Design)</p>
                <p>Marc Zitelli (Data Analysis & Reporting)</p>

                <h4>Special thanks to:</h4>
                <p>Christina Lu, Michael Donnelly, Ricky Grullon, Tyler Hutton</p>
                <p>Anna Li, Becca Foley, Eitan Darwish, Michael Kwan, Rahmn</p>

                <h4>People whose work inspired us:</h4>
                <p>Justin Fung, Matt Yarri, Julia Lynn, Joshua Pekera</p>
            </div>

            <div className="faq">
                <h4>FAQ</h4>
                <h5>What does a time of 8:00 a.m. mean?</h5>
                <p>
                    This refers to all riders who entered their origin station between 8:00 a.m. and 8:59 a.m. and doesn't account for travel time.
                </p>
                <h5>Why can't I choose a specific day of the year?</h5>
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
                <h5>What does the "Bar scale" setting do?</h5>
                <p>
                    Since some stations have many more riders than others, this option allows changing the height of the bars to make the smaller numbers more visible. When "Auto" is displayed, we automatically adjust the scale based on the maximum ridership across the 24 hours. When the lock icon is displayed, the scale remains fixed—this is useful if you'd like to compare the data for different days, months, or stations.
                </p>
            </div>
        </div>  
    </div>
    )
}