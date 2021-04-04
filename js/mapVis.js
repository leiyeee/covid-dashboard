/* * * * * * * * * * * * * *
 *          MapVis          *
 * * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, geodata, covidData, usaData) {


        this.covidData = covidData;
        this.usaData = usaData;
        this.parentElement = parentElement;
        this.geo = topojson.feature(geodata, geodata.objects.states).features;
        this.displayData = geodata;
        this.parseDate = d3.timeParse("%m/%d/%Y");



        this.initVis();



    }


    initVis() {
        let vis = this;
        this.linear = d3.scaleLinear().range([0, 1]);
        this.compute = d3.interpolate('#ffe6e6', "#ff3333");



        vis.margin = {
            top: 20,
            right: 50,
            bottom: 20,
            left: 50
        };
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;




        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("viewBox", [0, 0, 975, 800])
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        vis.path = d3.geoPath();



        vis.tooltip = d3.select("body").append("div")
            .attr("class", "svg-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .html("");


        vis.wrangleData()


    }



    wrangleData() {
        let vis = this

        // check out the data
        // console.log(vis.covidData)
        // console.log(vis.usaData)

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({
            key,
            value
        }))

        // have a look
        // console.log(covidDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        // merge
        covidDataByState.forEach(state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2019"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo.push({
                state: stateName,
                population: population,
                absCases: newCasesSum,
                absDeaths: newDeathsSum,
                relCases: (newCasesSum / population * 100),
                relDeaths: (newDeathsSum / population * 100)
            })



        });



        vis.geo.forEach(
            (d) => {
                vis.stateInfo.forEach(dd => {
                    if (d.properties.name == dd.state) {
                        d.properties.info = dd;
                    }
                })
            }
        )


        vis.updateVis();



    }




    updateVis() {
        let vis = this;
        vis.linear.domain([0, d3.max(vis.stateInfo, d => d[selectedbar])]);

        // console.log(vis.linear.domain())

        vis.svg.selectAll("path.map")
            .data(vis.geo)
            .attr("fill", function (d, i) {
                return vis.compute(vis.linear(d.properties.info[selectedbar]));
            })

        vis.svg.selectAll("path.map")
            .data(vis.geo)
            .enter()
            .append("path")
            .attr("class", "map")
            .attr("d", vis.path)
            .attr("stroke", "#b3d1ff")
            .attr("stroke-width", 0.5)
            .attr("fill", function (d, i) {
                return vis.compute(vis.linear(d.properties.info[selectedbar]));
            })
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .attr("opacity", .5)


                vis.tooltip
                    .style("visibility", "visible")
                    .html(`#0066ff
                
                <p>State:${d.properties.info.state}</p>
                <p>Population:${d.properties.info.population}</p>
                <p>New Cases (abs):${d.properties.info[selectedbar]}</p>
                <p>New Cases (rel):${d.properties.info.relCases}</p>
                <p>New Deaths (abs):${d.properties.info.absDeaths}</p>
                <p>New Deaths (rel):${d.properties.info.relDeaths}</p>
                `)
                // console.log(d)

            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr("opacity", 1)

                vis.tooltip.style("visibility", "hidden");

            })
            .on("mousemove", function (e) {
                vis.tooltip.style("top", (e.pageY - 10) + "px").style("left", (e.pageX + 10) + "px");
            })


        vis.svg.selectAll("rect")
            .data(d3.range(10))
            .enter()
            .append('rect')
            .attr('x', (d, i) => i * 20 + vis.width / 2 + 180)
            .attr('y', 650)
            .attr('width', 30)
            .attr('height', 40)
            .style('fill', (d, i) => vis.compute(i / 10.0))

        vis.svg.selectAll(".mytext")
            .data([0])
            .enter()
            .append("text")
            .attr("class", "mytext")
            .text(d3.max(vis.stateInfo, d => d[selectedbar]))
            .attr('x', (d, i) => 9 * 31 + vis.width / 2 + 100)
            .attr('y', 720)
            .style("fill", "#b3d1ff")


        vis.svg.selectAll(".mytext").text(d3.max(vis.stateInfo, d => d[selectedbar]))

        vis.svg.selectAll(".mytext2")
            .data([0])
            .enter()
            .append("text")
            .attr("class", "mytext2")
            .text("0")
            .attr('x', (d, i) => vis.width / 2 + 180)
            .attr('y', 720)
            .style("fill", "#b3d1ff")


    }







}
