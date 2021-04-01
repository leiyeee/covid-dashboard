/* * * * * * * * * * * * * *
 *      class BarVis        *
 * * * * * * * * * * * * * */


class BarVis {

    constructor(parentElement, data) {

        this.parentElement = parentElement;
        this.data = data;

        this.initVis();

    }

    initVis() {
        let vis = this;
        vis.margin = {
            top: 30,
            right: 20,
            bottom: 40,
            left: 70
        };
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text('Barchart')
            .attr('transform', `translate(${vis.width / 2}, -10)`)
            .attr('text-anchor', 'middle')
            .style("fill", "#b3d1ff");




        vis.funy = (d) => d[selectedbar];
        vis.funx = (d) => d["state"];

        vis.yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => vis.funy(d))])
            .range([vis.height, 0]).nice();

        // console.log(vis.data.map((d) => vis.funx(d)))

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(10)


        vis.xScale = d3.scaleBand()
            .domain(vis.data.map((d) => vis.funx(d)))
            .range([0, vis.width])
            .padding(0.5);

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale);

        vis.svg.append("g")
            .call(vis.yAxis)
            .attr("class", "yAxis")


        vis.svg.append("g")
            .call(vis.xAxis)
            .attr("class", "xAxis")
            .attr('transform', `translate(0, ${vis.height})`)
            .selectAll("text")
            .attr("dx", "-.8em")
            .attr("dy", "1em")
            .attr("transform", "rotate(-15)");


        vis.tooltip = d3.select("body").append("div")
            .attr("class", "svg-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .html("");



        this.wrangleData();

    }

    wrangleData() {
        let vis = this

        // console.log(vis.data);


        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        vis.yScale.domain([0, d3.max(vis.data, d => vis.funy(d))])

        vis.svg.select(".yAxis").call(vis.yAxis)

        vis.xScale.domain(vis.data.map((d) => vis.funx(d)))
        vis.svg.select(".xAxis").call(vis.xAxis);

        vis.svg.selectAll(".myrect")
            .data(vis.data)
            .exit()
            .remove();

        vis.svg.selectAll(".myrect")
            .data(vis.data)
            .enter()
            .append("rect")
            .attr("class", "myrect")
            // .attr("transform", "translate(80,30)")
            .attr('y', d => vis.yScale(vis.funy(d)))
            .attr('x', d => vis.xScale(vis.funx(d)))
            .attr('height', d => vis.height - vis.yScale(vis.funy(d)))
            .attr('width', vis.xScale.step() - 30)
            .attr("fill", (d) => myMapVis.compute(myMapVis.linear(d[selectedbar])))
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .attr("stroke", "red")
                    .attr("stroke-width", 1);


                vis.tooltip
                    .style("visibility", "visible")
                    .html(`
                
                <p>State:${d.state}</p>
                <p>Population:${d.population}</p>
                <p>New Cases (abs):${d[selectedbar]}</p>
                <p>New Cases (rel):${d.relCases}</p>
                <p>New Deaths (abs):${d.absDeaths}</p>
                <p>New Deaths (rel):${d.relDeaths}</p>
                `)

            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr("stroke-width", 0);

                vis.tooltip.style("visibility", "hidden");

            })
            .on("mousemove", function (e) {
                vis.tooltip.style("top", (e.pageY - 10) + "px").style("left", (e.pageX + 10) + "px");
            });



        vis.svg.selectAll(".myrect")
            .data(vis.data)
            .attr('y', d => vis.yScale(vis.funy(d)))
            .attr('x', d => vis.xScale(vis.funx(d)))
            .attr('height', d => vis.height - vis.yScale(vis.funy(d)))
            .attr('width', vis.xScale.step() - 30)






    }






}
