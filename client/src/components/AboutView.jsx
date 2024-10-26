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
                Our project is built on the MTA's <a href="https://new.mta.info/article/introducing-subway-origin-destination-ridership-dataset" target='blank'>Subway Origin-Destination Ridership dataset</a>, which estimates the number of subway riders traveling between any pair of stations. Although the MTA doesn't track when passengers exit the system, we can guess where they went by assuming that their next trip is from the same station. The dataset can be filtered by time of day, day of the week, and month, allowing for deep insights into how the city moves based on workday patterns, events, and community demographics. Though the 2024 dataset is being continuously updated, we used the 2023 dataset so that we would have data for the entire calendar year.
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
                </div>
    </div>
    )
}