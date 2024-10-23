import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import scrollama from 'scrollama';
import './StoriesView.css';
import { FlyToInterpolator } from 'deck.gl';
import { areViewportsNearlyEqual, getViewportForBounds } from '../lib/map-bounds';
import { stationIdToStation } from '../lib/stations';
import { MAIN_STATION_COLOR } from './MTADataMap';
import StoryProgress from './StoryProgress';
import AttributedPhoto from './AttributedPhoto';
import { ALL_STATIONS_ID } from '../lib/all-stations';

export const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const getStories = (StationHighlightComponent) => [
  {
    title: 'A Tale of Five Chinatowns',
    parts: [
      {
        description: <>
          <AttributedPhoto 
            src="/chinatown.jpeg" 
            alt="Busy street in Chinatown with colorful signs" 
            attribution="Photo: Peeter Viisimaa"
          />
          <p>
            <span className="opening-phrase">"They go in the morning for Dim Sum,"</span>
            {" "}explains Anna Li, 28, when I ask why hundreds of people flock from her neighborhood, Bensonhurst, to Manhattan's Chinatown every Saturday at 8 a.m. 
          </p>
          <p>
            Bensonhurst, where Anna moved after college, and Sunset Park, where she grew up, house the two largest Chinese communities in Brooklyn. 
            Although younger generations of Chinese are choosing more and more to settle away from the din of Manhattan, the original Chinatown is still a crucial gathering place for the community.
          </p>
        </>,
        // Spring St (6), Coney Island-Stillwell Av (D F N Q), and Bay Ridge-95 St (R)
        pointsToInclude: [stationIdToStation['409'], stationIdToStation['58'], stationIdToStation['39']], 
        dataview: {
          station: '231', // Grand St (B D)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 8,
          months: ALL_MONTHS,
          visibleLines: ['B', 'D', 'N', 'F', 'R', 'Q'],
          barScale: 0.008,
        },
      },
      {
        description: <>
          <p>
            In her high school years, Anna joined the Saturday shuffle, taking the D train to <StationHighlightComponent stationId="231">Grand St</StationHighlightComponent> to play volleyball in Seward Park. Many of her friends held part-time jobs in the neighborhood. For these high school students without cars, downtown Manhattan served as a central and invigorating meeting point. 
          </p>
          <p>
            Even the adults, who would normally drive when in Brooklyn, chose to take the subway into Chinatown to attend to business and call on older family members. “The elders who live in Chinatown, we don't make them come to us. We come to them.”
          </p>
        </>,
        pointsToInclude: [stationIdToStation['409'], stationIdToStation['58'], stationIdToStation['39']],
        dataview: {
          station: '231', // Grand St (B D)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 8,
          months: ALL_MONTHS,
          visibleLines: ['D'],
          barScale: 0.008,
        },
      },
      {
        description: <>
          <p>
            The Brooklyn Chinese aren't the only ones heading into Manhattan's Chinatown on the weekend. A smaller but just as determined handful makes the even longer trek from <StationHighlightComponent stationId="447">Flushing</StationHighlightComponent>, Queens, catching the 7 train into Manhattan and transferring downtown. 
          </p>
          <p>
            But Flushing, too, draws crowds from near and far. Home to the largest Chinatown outside of Asia, the neighborhood has become a mammoth destination in its own right. 
          </p>
        </>,
        // Grand St (B D) and Flushing-Main St (7)
        pointsToInclude: [stationIdToStation['231'], stationIdToStation['447']],
        dataview: {
          station: '231', // Grand St (B D)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 8,
          months: ALL_MONTHS,
          visibleLines: ['7', '6', 'D', 'N'],
          barScale: 0.008,
        },
      },
      {
        description: <>
          <p>
            Increasingly crowded and prosperous, Flushing is now the fourth largest business district in New York City. During rush hour, a surge of accountants, teachers, nurses, and retail workers pour in.
          </p>
          <p>
            Many of them hail from mainland Chinese enclaves in the satellite neighborhoods of <StationHighlightComponent stationId="452">Elmhurst</StationHighlightComponent> and <StationHighlightComponent stationId="450">Corona</StationHighlightComponent>. In Flushing, the chatter one hears is often in Mandarin, unlike the Cantonese more commonly heard in Manhattan's Chinatown and Bensonhurst.
          </p>
        </>,
        // viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
        // Flushing-Main St (7) and Vernon Blvd-Jackson Av (7)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['464']],
        dataview: {
          station: '447', // Flushing-Main St (7)
          direction: 'comingFrom',
          day: 'Monday',
          hour: 7,
          months: ALL_MONTHS,
          visibleLines: ['7'],
          barScale: 0.004,
        },
      },
      {
        description: <>
          <p>
            On weekends, straphangers pour back into Flushing for another reason: the food. The neighborhood is a mecca for regional cuisine, featuring staple dishes like Hunan stewed fish, Shanghai braised pork belly, and bing tanghulu (candied hawthorn fruits).
          </p>
          <p>
            Restaurant workers are first out the door at 7 a.m. Come lunchtime and dinnertime, the Corona crowd is joined by a new lot of younger, affluent Chinese from Manhattan and <StationHighlightComponent stationId="461">Long Island City</StationHighlightComponent>. 
          </p>
          <p>
            While LIC isn't considered a Chinatown on its own, its population has soared as young professionals and tech workers seeking newer apartment buildings close to both Flushing and Midtown have set up camp. <span className="story-end-marker"/>
          </p>
        </>,
        // viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
        // Flushing-Main St (7) and Vernon Blvd-Jackson Av (7), 34th St-Hudson Yards (7)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['464'], stationIdToStation['471']],
        dataview: {
          station: '447', // Flushing-Main St (7)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 17,
          months: ALL_MONTHS,
          visibleLines: ['7'],
          barScale: 0.008,
        },
      }
    ]
  },
  {
    title: 'Nightlife Along the L Train',
    parts: [
      {
        description: <>
          <AttributedPhoto 
            src="/jefferson-1.jpg" 
            alt="Revelers outside of a food truck on Jefferson St at night" 
            attribution="Photo: /u/donny_hype"
          />
          <p>
            For young people in New York, life unfolds most vividly after dark. In recent years, nightlife along the L train has exploded, with enticing options from 8th Avenue to Bushwick. One of the most popular neighborhoods along the line is the East Village.
          </p>
          <p>
            Considering the arrivals to 1st Avenue at 11PM on a Saturday night, we can see that the East Village and Alphabet City is a hotbed of nightlife, with bars like Niagara, Heaven Can Wait, and The Penny Farthing drawing crowds from Midtown Manhattan to Bushwick. 
          </p>
        </>,
        // Halsey St (L), 8 Av (L), 59 St-Columbus Circle
        pointsToInclude: [stationIdToStation['129'], stationIdToStation['618'], stationIdToStation['614']],
        dataview: {
          station: '119', // 1 Av (L)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 23,
          months: ALL_MONTHS,
          barScale: 0.015,
          // All lines that you can take to get to the East Village
          visibleLines: ['L', 'F', 'M', '6', 'Q'],
        },
      },
      {
        description: <>
          <p>
            Even with this plethora of options, some residents of the East Village prefer to go out in other locales, sometimes even intentionally avoiding their own neighborhood. Becca Foley, a young resident, explains:
          </p>
          <p>
            “I'm 26 and the crowd in the East Village feels a lot younger. A lot of kids are visiting and some are interns, so I think it's more fun to go out with a more local scene in Williamsburg and Bushwick. It's mostly about the age, but I also have better conversations with people [in Bushwick] since they're more mature and there's a lot more diversity in terms of sexuality, gender, and background.”
          </p>
        </>,
        // Halsey St (L), 8 Av (L), 59 St-Columbus Circle
        pointsToInclude: [stationIdToStation['129'], stationIdToStation['618'], stationIdToStation['614']],
        dataview: {
          station: '119', // 1 Av (L)
          direction: 'goingTo',
          day: 'Saturday',
          hour: 23,
          months: ALL_MONTHS,
          barScale: 0.015,
          visibleLines: ['L'],
        },
      },
      {
        description: <>
          <p>
            A smaller but equally dedicated crowd, hundreds of young revelers embark on a weekly pilgrimage to Bushwick. A neighborhood featuring bars and clubs like Carousel, Abe's Pagoda, The Johnson's, and House of Yes, Bushwick is inundated with partygoers who liven the streets around the <StationHighlightComponent stationId="126">Jefferson St</StationHighlightComponent>, <StationHighlightComponent stationId="127">DeKalb Avenue</StationHighlightComponent>, and <StationHighlightComponent stationId="128">Myrtle-Wyckoff</StationHighlightComponent> stops along the L train. 
          </p>
          <p>
            Considering, for example, the Jefferson St station at 11 PM on a Saturday evening, we can see the influx coming from Williamsburg, the East Village, the Lower East Side, and even as far as Times Square in Manhattan.
          </p>
        </>,
        // Halsey St (L), 8 Av (L), 59 St-Columbus Circle
        pointsToInclude: [stationIdToStation['129'], stationIdToStation['618'], stationIdToStation['614']],
        dataview: {
          station: '126', // Jefferson St (L)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 23,
          months: ALL_MONTHS,
          barScale: 0.015,
          visibleLines: ['L'],
        },
      },
      {
        description: <>
          <p>
            As expected, the season plays a role in how many people are willing to make the trek to Bushwick.
          </p>
          <p>
             In the wintry months of January, February, and March, fewer people are going out than during the rest of the year. But even on the coldest nights, there is still a core group of partygoers undeterred by the wind and cold. 
          </p>
          <p>
            The biggest month of 2023 was October. It's the perfect storm: college students are back in town and the month is bookended by Halloween. Thanks to the changing climate, the weather is often still mild.
          </p>
        </>,
        // Halsey St (L), 8 Av (L), 59 St-Columbus Circle
        pointsToInclude: [stationIdToStation['129'], stationIdToStation['618'], stationIdToStation['614']],
        dataview: {
          station: '126', // Jefferson St (L)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 23,
          months: [0],
          barScale: 0.015,
          visibleLines: ['L'],
          animate: {
            field: 'months',
            frames: [
              { value: [0], duration: 2500 },
              { value: [1], duration: 750 },
              { value: [2], duration: 750 },
              { value: [3], duration: 2500 },
              { value: [4], duration: 750 },
              { value: [5], duration: 750 },
              { value: [6], duration: 2500 },
              { value: [7], duration: 750 },
              { value: [8], duration: 750 },
              { value: [9], duration: 2500 },
              { value: [10], duration: 750 },
              { value: [11], duration: 750 },
            ]
          },
        },
      },
      {
        description: <>
          <p>
            Known for its high concentration of “open until the sun comes up bars”, (include pic of House of Yes) Bushwick features a crowd eager to stay out later than most. Looking at late-night departures from stations along the L, we can see that the party rages later in Bushwick than in its tamer Williamsburg counterpart. 
          </p>
        </>,
        viewport: {
          longitude: -73.936,
          latitude: 40.735,
          zoom: 12.44,
          bearing: 23.94,
          pitch: 60,
        },
        dataview: {
          station: ALL_STATIONS_ID,
          direction: 'goingTo',
          day: 'Sunday',
          hour: 1,
          months: ALL_MONTHS,
          barScale: 0.005,
          visibleLines: ['L'],
          animate: {
            field: 'hour',
            frames: [
              { value: 1, duration: 1000 },
              { value: 2, duration: 1000 },
              { value: 3, duration: 1000 },
              { value: 4, duration: 1000 },
            ]
          },
        },
      },
    ]
  },
  {
    title: 'How New York City Works',
    parts: [
      {
        description: <>
          <AttributedPhoto 
            src="/grand-central.jpg" 
            alt="Crowd at Grand Central Station during rush hour" 
            attribution="Photo: Heather Paul"
          />
          <p>
            If New York was a country, it would have the 10th largest economy in the world. 
            An astronomical number of people flood into the city at rush hour every weekday to go to work. 
          </p>
          <p>
            Economic activity is concentrated in the city's multiple central business districts. Midtown Manhattan is the densest business hub in the world, and the Financial District is not far behind. Downtown Brooklyn has grown significantly in recent decades, but still comes in a distant third. Let's take a look at each of them.
          </p>
        </>,
        // Smith-9 Sts (F G), Bowling Green (4 5), 96 St (6), Mosholu Pkwy (4)
        // pointsToInclude: [stationIdToStation['238'], stationIdToStation['414'], stationIdToStation['396'], stationIdToStation['379']],
        viewport: { longitude: -74.02, latitude: 40.68, zoom: 10.8, bearing: -110, pitch: 55 },
        dataview: {
          station: ALL_STATIONS_ID,
          direction: 'comingFrom',
          day: 'Wednesday',
          hour: 5,
          months: ALL_MONTHS,
          barScale: 0.0005,
          animate: {
            field: 'hour',
            frames: [
              { value: 5, duration: 1000 },
              { value: 6, duration: 1000 },
              { value: 7, duration: 1000 },
              { value: 8, duration: 4000 },
            ]
          },
        },
      },
      {
        description: <>
          <p>
            Midtown is massive, and its busiest stations are near commuter hubs like Grand Central that connect the city to the suburbs. But we can look at <StationHighlightComponent stationId="612">Lexington Avenue/51 St</StationHighlightComponent> as a representative example.
          </p>
          <p>
            Workers are coming from all over the city, especially from high-density areas with a direct trip to the station, like Jackson Heights in Queens. The largest local spike, <StationHighlightComponent stationId="397">86 St</StationHighlightComponent>, likely represents commuters from Yorkville, the most densely populated neighborhood in the city.
          </p>
          <p>
            But it's notable that a large share of riders appear to be traveling from outside New York, with spikes at <StationHighlightComponent stationId="164">Penn Station</StationHighlightComponent> and the <StationHighlightComponent stationId="611">Port Authority</StationHighlightComponent>.
          </p>
        </>,
        // Bowling Green, 168 St-Washington Heights, Kew Gardens-Union Tpke, Prospect Park
        pointsToInclude: [stationIdToStation['414'], stationIdToStation['605'], stationIdToStation['259'], stationIdToStation['42']],
        dataview: {
          station: '612', // Lexington Av/51 St
          direction: 'comingFrom',
          day: 'Wednesday',
          hour: 8,
          months: ALL_MONTHS,
          barScale: 0.003,
        },
      },
      {
        description: <>
          <p>
            The <StationHighlightComponent stationId="611">Port Authority Bus Terminal</StationHighlightComponent> is the busiest bus terminal in the world, with 225,000 passengers passing through on a typical weekday. One of our contributors, Marc Zitelli, recounts his experience commuting to New Jersey from the PABT while working on a political campaign.
          </p>
          <p>
            "The foot traffic was insane, like difficult to even move at points. But it was nice that I always got a seat on the bus, since everybody was coming into the city at 8 AM on weekdays, not leaving the city."
          </p>
          <p>
            Most commuters arriving at the Port Authority will remain in Manhattan. They go to Midtown the most, then the Financial District and Downtown Brooklyn, in accordance with the size of those business hubs.
          </p>
        </>,
        // Bowling Green, 168 St-Washington Heights, Kew Gardens-Union Tpke, Prospect Park
        pointsToInclude: [stationIdToStation['414'], stationIdToStation['605'], stationIdToStation['259'], stationIdToStation['42']],
        dataview: {
          station: '611', // 42 St-Times Sq/Port Authority
          direction: 'goingTo',
          day: 'Wednesday',
          hour: 8,
          months: ALL_MONTHS,
          barScale: 0.003,
        },
      },
      {
        description: <>
          <p>
            When we look at the ridership to the Financial District, anchored by the <StationHighlightComponent stationId="628">Fulton St</StationHighlightComponent> station, the pattern is strikingly different. By far the largest share of riders are coming from <StationHighlightComponent stationId="610">Grand Central</StationHighlightComponent>, dwarfing those from <StationHighlightComponent stationId="318">Penn Station</StationHighlightComponent> and the <StationHighlightComponent stationId="611">Port Authority</StationHighlightComponent>.
          </p>
          <p>
            One explanation for this unbalance is that Grand Central is the main hub for commuters from wealthy suburbs like Scarsdale in Westchester and New Canaan in Connecticut. That demographic might be more likely to work in high-paying finance jobs than, say, bus riders from New Jersey.
          </p>
        </>,
        // Bowling Green, 168 St-Washington Heights, Kew Gardens-Union Tpke, Flatbush Ave-Brooklyn College
        pointsToInclude: [stationIdToStation['414'], stationIdToStation['605'], stationIdToStation['259'], stationIdToStation['356']],
        dataview: {
          station: '628', // Fulton St
          direction: 'comingFrom',
          day: 'Wednesday',
          hour: 8,
          months: ALL_MONTHS,
          barScale: 0.003,
        },
      },
      {
        description: <>
          <p>
            Many of Brooklyn's downtown offices are a short walk from the <StationHighlightComponent stationId="636">Jay St-MetroTech</StationHighlightComponent> stop. The MetroTech Center itself was recently renamed Brooklyn Commons, after it was purchased by the investment firm Brookfield.
          </p>
          <p>
            There's still plenty of out-of-town traffic to Downtown Brooklyn, from the <StationHighlightComponent stationId="611">Port Authority</StationHighlightComponent>, <StationHighlightComponent stationId="164">Penn Station</StationHighlightComponent>, and the PATH train through the Financial District. But this business district draws a higher proportion of local commuters than Manhattan's larger corridors.
          </p>
          <p>
            It serves as a hub for workers across the borough, from <StationHighlightComponent stationId="240">Park Slope</StationHighlightComponent> to <StationHighlightComponent stationId="36">Bay Ridge</StationHighlightComponent> to <StationHighlightComponent stationId="188">East New York</StationHighlightComponent>. A number of people come all the way from Queens. Most of them must transfer through Manhattan, due to the lack of interborough connections.
            <span className="story-end-marker"/>
          </p>
        </>,
        // 59 St-Columbus Circle, Ditmas Av, Ozone Park-Lefferts Blvd, Bay Ridge-95 St
        pointsToInclude: [stationIdToStation['614'], stationIdToStation['244'], stationIdToStation['195'], stationIdToStation['39']],
        dataview: {
          station: '636', // Jay St-MetroTech
          direction: 'comingFrom',
          day: 'Wednesday',
          hour: 8,
          months: ALL_MONTHS,
          barScale: 0.003,
        },
      },
    ]
  },
  {
    title: 'Fans & Food in Flushing Meadows',
    parts: [
      {
        description: <>
          <AttributedPhoto 
            src="/grandstand.jpg" 
            alt="Grandstand at the US Open Tennis Center" 
            attribution="Photo: NYC Parks"
          />
          <p>
            Flushing Meadows Park, nestled between Flushing and Corona, Queens, boasts no less than four stadiums with a combined seating of nearly 100,000. 
          </p>
          <p>
            It's home to the New York Mets, and hosts the internationally renowned US Open tennis tournament. It's also the fourth largest park in New York City, just edging out Central Park. But on a frigid day in January, hardly anyone has a reason to head over.
          </p>
        </>,
        // Flushing-Main St (7), Bowling Green (4 5) and 137 St-City College (1)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['414'], stationIdToStation['305']],
        dataview: {
          station: '448', // Mets-Willets Point
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 17,
          months: [0],
          barScale: 0.006,
        },
      },
      {
        description: <>
          <p>It's a different story on game day. Once the baseball season begins in late March, tens of thousands pile into Citi Field. Some fans drive or take the LIRR, but most locals jam onto the 7 train to <StationHighlightComponent stationId="448">Mets-Willets Point</StationHighlightComponent>.</p>
          <p>They come from all over, especially nearby Queens. Two big spikes at <StationHighlightComponent stationId="610">Grand Central</StationHighlightComponent> and the <StationHighlightComponent stationId="611">Port Authority</StationHighlightComponent> represent the thousands who come into the city from all over the Tri-State area.</p>
        </>,
        // Flushing-Main St (7), Bowling Green (4 5) and 137 St-City College (1)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['414'], stationIdToStation['305']],
        dataview: {
          station: '448', // Mets-Willets Point
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 17,
          months: [4, 5, 6, 7],
          barScale: 0.006,
          visibleLines: ['7'],
        },
      },
      {
        description: <>
          <p>
            In late summer, things get even more packed as the US Open kicks off. Eitan Darwish, a former ball boy, used to take the 7 to the Billie Jean King Tennis Center at 8 a.m. every morning. 
          </p>
          <p>
            “The players don't take the train, they get private cars from their hotel,” he notes. “Ball boys can take an hourly shuttle, but I think the subway is faster with the traffic.” 
          </p>
          <p>
            The Open has a morning session that starts at 11, and then an evening session at 7. We can see distinct spikes on the map before each session, with many fans again coming from out of town.
          </p>
        </>,
        // Flushing-Main St (7), Bowling Green (4 5) and 137 St-City College (1)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['414'], stationIdToStation['305']],
        dataview: {
          station: '448', // Mets-Willets Point
          direction: 'comingFrom',
          day: 'Saturday',
          hours: 7,
          months: [7, 8],
          barScale: 0.006,
          visibleLines: ['7'],
          animate: {
            field: 'hour',
            frames: [
              { value: 7, duration: 500 },
              { value: 8, duration: 500 },
              { value: 9, duration: 500 },
              { value: 10, duration: 3000 },
              { value: 11, duration: 500 },
              { value: 12, duration: 500 },
              { value: 13, duration: 500 },
              { value: 14, duration: 500 },
              { value: 15, duration: 500 },
              { value: 16, duration: 500 },
              { value: 17, duration: 500 },
              { value: 18, duration: 3000 },
            ]
          }
        },
      },
      {
        description: <>
          <p>
            The MTA's data is averaged over the course of the month, but major events drive enough traffic that we can pinpoint them anyway.
          </p>
          <p>
            Eitan cautions, “The Mets play away games half the time, but some nights that overlap [with the US Open] happens. When it happens on a Semifinals night, the traffic is insane.”
          </p>
          <p>
            One such night was Wednesday, August 30, 2023. The Mets eked out a 6-5 victory over the Rangers while Zhang Zhizhen (China) upset Casper Ruud (Norway) in the 2nd round.
          </p>
        </>,
        // Flushing-Main St (7), Bowling Green (4 5) and 137 St-City College (1)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['414'], stationIdToStation['305']],
        dataview: {
          station: '448', // Mets-Willets Point
          direction: 'comingFrom',
          day: 'Wednesday',
          hour: 17,
          months: [7],
          barScale: 0.006,
          visibleLines: ['7'],
        },
      },
      {
        description: <>
          <p>
            Since 2015, there's one more reason for New Yorkers to head to Flushing Meadows: Queens Night Market.
          </p>
          <p>
            There, over one hundred vendors serve foods from cuisines all over the world. The market runs Saturdays from April to October on the west side of Flushing Meadows, off the <StationHighlightComponent stationId="449">111 St</StationHighlightComponent> stop.
          </p>
          <p>
            The event is the perfect essence of Queens, the most ethnically diverse place in the world. Where else can you eat Trinidadian doubles, Mongolian yak cheese, and a Sudanese sambuxa in one meal? <span className="story-end-marker"/>
          </p>
        </>,
        // Flushing-Main St (7), Bowling Green (4 5) and 137 St-City College (1)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['414'], stationIdToStation['305']],
        dataview: {
          station: '449', // 111 St
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 18,
          months: [5, 6, 7],
          barScale: 0.006,
          visibleLines: ['7'],
        },
      },
    ]
  },
  {
    title: 'Working on the Weekend',
    parts: [
      {
        description: <>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </>,
        viewport: { longitude: -73.98, latitude: 40.75, zoom: 12, bearing: 0, pitch: 0 },
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']], // Times Sq-42 St (1 2 3) and 34 St-Penn Station (1 2 3)
        dataview: {
          station: '611', // Times Sq-42 St (1 2 3)
          direction: 'goingTo',
          day: 'Monday',
          hour: 9,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
      {
        description: <>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </>,
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']],
        dataview: {
          station: '127', // 34 St-Penn Station (1 2 3)
          direction: 'comingFrom',
          day: 'Friday',
          hour: 18,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
    ]
  }
];

// todo: make this dynamic based on the width of the screen
const STORY_BOX_WIDTH_AND_OFFSET = 440;
const FLOATING_INFO_BAR_HEIGHT = 54;
const FLOATING_INFO_BAR_OFFSET = 20;
const COLOR_LEGEND_WIDTH_AND_OFFSET = 105;

const StoryBox = ({ story, partIndex = 0, isPreview = false }) => (
  <div className={`stories-box ${isPreview ? 'preview' : ''}`}>
    {story.title !== undefined && partIndex === 0 && <h2>{story.title}</h2>}
    <div className="story-content">
      {story.parts[partIndex].description}
    </div>
  </div>
);

const StoriesView = React.memo(({
  handleDataSettingsChange,
  setViewport, 
  limitVisibleLines,
  selectedDirection,
  selectedStation,
  selectedHour,
  selectedDay,
  selectedMonths,
  currentStoryIndex,
  currentPartIndex,
  setCurrentStoryIndex,
  setCurrentPartIndex,
  setHoveredStation,
  mapRef,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(scrollama());
  const [previewStory, setPreviewStory] = useState(null);
  const [animation, setAnimation] = useState(null);
  const [isStackView, setIsStackView] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollAnimatingToPart = useRef(null);

  const StationHighlightComponent = useCallback(({ children, stationId }) => (
    <StationHighlight stationId={stationId} setHoveredStation={setHoveredStation} containerRef={containerRef}>
      {children}
    </StationHighlight>
  ), [selectedStation, setHoveredStation]);
  const stories = useMemo(() => getStories(StationHighlightComponent), [getStories, StationHighlightComponent]);

  const getPadding = () => {
    return {
      top: window.innerHeight * 0.05,
      bottom: window.innerHeight * 0.05 + FLOATING_INFO_BAR_HEIGHT + FLOATING_INFO_BAR_OFFSET,
      left: window.innerWidth * 0.05 + STORY_BOX_WIDTH_AND_OFFSET,
      right: window.innerWidth * 0.03 + COLOR_LEGEND_WIDTH_AND_OFFSET,
    };
  }
  
  const handleStepEnter = useCallback((response) => {
    const { index } = response;
    let storyIndex = 0;
    let partIndex = index;

    // Calculate the current story and part index
    for (let i = 0; i < stories.length; i++) {
      if (partIndex < stories[i].parts.length) {
        storyIndex = i;
        break;
      }
      partIndex -= stories[i].parts.length;
    }

    if (scrollAnimatingToPart.current) {
      const { storyIndex: targetStoryIndex, partIndex: targetPartIndex } = scrollAnimatingToPart.current;
      if (storyIndex !== targetStoryIndex || partIndex !== targetPartIndex) {
        return;
      } else {
        scrollAnimatingToPart.current = null;
      }
    }

    setCurrentStoryIndex(storyIndex);
    setCurrentPartIndex(partIndex);

    const currentStory = stories[storyIndex];
    const currentPart = currentStory.parts[partIndex];

    setViewport(viewport => {
      const newViewport = currentPart.viewport || getViewportForBounds({
        pointsToInclude: currentPart.pointsToInclude,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        padding: getPadding(),
      });

      const transition = areViewportsNearlyEqual(viewport, newViewport) ? {} : {
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      };
      return {
        ...newViewport,
        ...transition,
      };
    });

    const hour = currentPart.dataview.animate?.field === 'hour' 
      ? currentPart.dataview.animate.frames[0].value 
      : currentPart.dataview.hour;

    const months = currentPart.dataview.animate?.field === 'months' 
      ? currentPart.dataview.animate.frames[0].value 
      : currentPart.dataview.months;

    handleDataSettingsChange({
      newSelectedStation: currentPart.dataview.station,
      newSelectedDirection: currentPart.dataview.direction,
      newSelectedDay: currentPart.dataview.day,
      newSelectedHour: hour,
      newSelectedMonths: months,
      newSelectedBarScale: currentPart.dataview.barScale,
    });
    limitVisibleLines(currentPart.dataview.visibleLines);

    if (currentPart.dataview.animate) {
      setAnimation(currentPart.dataview.animate);
    } else {
      setAnimation(null);
      handleDataSettingsChange({
        newSelectedHour: currentPart.dataview.hour,
        newSelectedMonths: currentPart.dataview.months,
      });
    }
  }, [setViewport, handleDataSettingsChange, limitVisibleLines, setCurrentStoryIndex, setCurrentPartIndex]);

  const handleJumpToStory = useCallback((storyIndex, partIndex, smooth = true) => {
    const storyBoxes = containerRef.current.querySelectorAll('.stories-box');
    let targetIndex = 0;
    
    // Calculate the target index based on story and part index
    for (let i = 0; i < storyIndex; i++) {
      targetIndex += stories[i].parts.length;
    }
    targetIndex += partIndex;

    if (storyBoxes[targetIndex]) {
      const targetElement = storyBoxes[targetIndex];
      const containerHeight = containerRef.current.clientHeight;
      const targetRect = targetElement.getBoundingClientRect();
      const targetTop = targetElement.offsetTop;
      const targetHeight = targetRect.height;

      // Calculate the scroll position to center the target element
      const scrollPosition = targetTop - (containerHeight / 2) + (targetHeight / 2);

      if (smooth) {
        // This will make sure we don't trigger onStepEnter until we've finished scrolling.
        scrollAnimatingToPart.current = { storyIndex, partIndex };
      }
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: smooth ? 'smooth' : 'instant'
      });
    }
  }, [stories]);

  const handleStoryClick = (storyIndex) => {
    setIsStackView(false);
    // We don't want to scroll through all stories because it's jarring.
    // We do want to scroll a little bit to indicate that it's scrollable.
    // So let's only animate scrolling from the last part of the previous story.
    if (storyIndex !== 0) {
      const lastPartOfPrevStory = stories[storyIndex-1].parts.length - 1;
      handleJumpToStory(storyIndex-1, lastPartOfPrevStory, false);
    }
    handleJumpToStory(storyIndex, 0, true);
  };

  useEffect(() => {
    if (!isStackView) {
      scrollerRef.current
        .setup({
          step: '.stories-box',
          offset: 0.5,
        })
        .onStepEnter(handleStepEnter);
    }
  }, [handleStepEnter, isStackView]);

  useEffect(() => {
    let timeoutId;
    if (animation) {
      let frameIndex = 0;
      const animateFrame = () => {
        if (frameIndex < animation.frames.length) {
          const frame = animation.frames[frameIndex];
          if (animation.field === 'hour') {
            handleDataSettingsChange({
              newSelectedHour: frame.value,
            });
          } else if (animation.field === 'months') {
            handleDataSettingsChange({
              newSelectedMonths: frame.value,
            });
          }
          timeoutId = setTimeout(() => {
            frameIndex++;
            animateFrame();
          }, frame.duration);
        } else {
          // Animation complete, restart
          frameIndex = 0;
          animateFrame();
        }
      };
      animateFrame();
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animation]);

  useEffect(() => {
    if (!isStackView) {

      // While scrolling on the map, we want the stories view to capture the events.
      // Once we're done scrolling we want to disable pointer events again so 
      // the user can interact with the map.
      let scrollTimeout;
      const handleWheel = () => {
        setIsScrolling(true);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
        }, 50);
      };

      window.addEventListener('wheel', handleWheel);

      return () => {
        window.removeEventListener('wheel', handleWheel);
        setIsScrolling(false);
      };
    }
  }, [isStackView]);

  return (
    <div className={`stories-view ${isStackView ? 'stack-view' : ''}`}>
      <StoryStack stories={stories} onStoryClick={handleStoryClick} />
      <div 
        className={`stories-view-container ${isStackView ? 'hidden' : ''}`} 
        ref={containerRef}
        style={{ pointerEvents: !isStackView && isScrolling ? 'all' : 'none' }}
      >
        <div className="stories-content" style={{ visibility: previewStory !== null ? 'hidden' : 'visible' }}>
          {stories.map((story, storyIndex) => (
            <React.Fragment key={storyIndex}>
              {story.parts.map((_, partIndex) => (
                <StoryBox 
                  key={`${storyIndex}-${partIndex}`}
                  story={story}
                  partIndex={partIndex}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="floating-info-bar" style={{visibility: previewStory !== null ? 'hidden' : 'visible'}}>
          <p>
          {formatInfoBarText(selectedDirection, selectedStation, selectedHour, selectedDay, selectedMonths, animation?.field)}  
          </p>
        </div>
      </div>
      {!isStackView && <StoryProgress
        stories={stories}
        currentStoryIndex={currentStoryIndex}
        currentPartIndex={currentPartIndex}
        handleJumpToStory={(storyIndex, partIndex) => handleJumpToStory(storyIndex, partIndex, false)}
        handleJumpToPart={(storyIndex, partIndex) => handleJumpToStory(storyIndex, partIndex, true)}
        setPreviewStory={setPreviewStory}
      />}
      {previewStory !== null && (
        <div className="story-preview">
          <StoryBox 
            story={stories[previewStory]}
            isPreview={true}
          />
        </div>
      )}
    </div>
  );
});

const StoryStack = ({ stories, onStoryClick }) => {
  const visibleStories = stories.slice(0, 5); // Limit to 5 visible stories

  return (
    <div className="story-stack">
      {visibleStories.map((story, index) => (
        <div 
          key={index} 
          className="story-card" 
          style={{ zIndex: visibleStories.length - index }}
          onClick={() => onStoryClick(index)}
        >
          <h2>{story.title}</h2>
          <div className="story-preview">
            {story.parts[0].description}
          </div>
          <div className="scroll-shadow"/>
        </div>
      ))}
    </div>
  );
};

const formatInfoBarText = (direction, stationId, hour, day, selectedMonths, animatingField) => {
  const stationName = stationIdToStation[stationId]?.display_name.split('(')[0].trim() || 'here';
  const directionText = direction === 'comingFrom' ? 'going to' : 'coming from';


  const formattedHour = hour % 12 || 12;
  const amPm = hour < 12 ? 'a.m.' : 'p.m.';
  let hourText = animatingField === 'hour' 
    ? <span className="animating">{formattedHour} {amPm}</span> 
    : `${formattedHour} ${amPm}`;

  let preposition = '';
  let monthText = '';
  let splitText = false
  if (selectedMonths.length < 12) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    if (selectedMonths.length === 1) {
      preposition = 'in';
      monthText = animatingField === 'months' 
        ? <span className="animating">{monthNames[selectedMonths[0]]}</span> 
        : `${monthNames[selectedMonths[0]]}`;
    } else {
      const firstMonth = monthNames[selectedMonths[0]];
      const lastMonth = monthNames[selectedMonths[selectedMonths.length - 1]];
      preposition = 'from';
      monthText = animatingField === 'months' 
        ? <span className="animating">{`${firstMonth} – ${lastMonth}`}</span> 
        : `${firstMonth} – ${lastMonth}`;
      splitText = true;
    }
  }

  const fullMonthText = monthText ? <>
    {' '}{preposition} {monthText}
  </> : '';

  if (stationId === ALL_STATIONS_ID) {
    const allStationsDirectionText = direction === 'comingFrom' ? 'getting off' : 'getting on';
    return (
      <>
        Where are people {allStationsDirectionText} the train at {hourText} {splitText ? <br /> : ''} on a {day}{fullMonthText}?
      </>
    )
  }

  return (
    <>
      Who's {directionText} <span className="highlight-station" style={{color: `rgb(${MAIN_STATION_COLOR.join(',')})`}}>{stationName}</span> at {hourText} {splitText ? <br /> : ''} on a {day}{fullMonthText}?
    </>
  );
};

const StationHighlight = ({ children, stationId, setHoveredStation, containerRef }) => {
  const handleMouseEnter = () => {
    setHoveredStation(stationId);
  };

  const handleMouseLeave = (e) => {
    setHoveredStation(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setHoveredStation(null);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [setHoveredStation]);

  return (
    <span
      className="station-highlight"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
};

export default StoriesView;
