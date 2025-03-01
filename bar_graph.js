var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);


export function drawBarChart(fuelData, countryName) {
    console.log(fuelData)
    // Define the known fuel categories in the correct order
    const fuelCategories = [
        "Coal", "Gas", "Oil", "Biomass", "Geothermal", "Tidal",
        "Hydro", "Wind", "Solar", "Nuclear", "Other"
    ];

    // Define a color mapping for each fuel type
    const fuelColors = {
        "Biomass": "#9e5418",
        "Coal": "#fc0303",
        "Gas": "#e01075",
        "Geothermal": "#8800ff",
        "Hydro": "#0398fc",
        "Nuclear": "#ff00f7",
        "Oil": "#eb7f7f",
        "Solar": "#e3bb0e",
        "Tidal": "#1859c9",
        "Wind": "#12c474",
        "Other": "#a8a8a8"
    };

    // Create a default object with all categories set to zero
    let defaultFuelData = fuelCategories.reduce((acc, fuelType) => {
        acc[fuelType] = { count: 0, totalCapacity: 0 };
        return acc;
    }, {});

    // List of fuel types that should be grouped under "Other"
    const knownFuelTypes = new Set(fuelCategories.slice(0, -1)); // Everything except "Other"

    // Merge actual fuel data with default structure, grouping unknowns into "Other"
    for (const [fuelType, values] of Object.entries(fuelData)) {
        const category = knownFuelTypes.has(fuelType) ? fuelType : "Other";
        defaultFuelData[category].count += values.count;
        defaultFuelData[category].totalCapacity += values.totalCapacity;
    }

    // Convert mergedFuelData into an array, keeping the desired order
    let data = fuelCategories.map(fuelType => ({
        fuelType,
        totalCapacity: Number(defaultFuelData[fuelType].totalCapacity) || 0
    }));

    if (data.length === 0) {
        console.warn("No data available for", countryName);
        return;
    }

    // Set up chart dimensions
    const width = 320;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    d3.select("#chart-container").select("svg").remove();
    d3.select("#chart-container").selectAll("div").remove();

    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale (respects the predefined order)
    const xScale = d3.scaleBand()
        .domain(fuelCategories) // Use predefined fuel order
        .range([0, width])
        .padding(0.3);

    const maxCapacity = d3.max(data, d => d.totalCapacity) || 1;
    const yScale = d3.scaleLinear()
        .domain([0, maxCapacity])
        .nice()
        .range([height, 0]); // Ensure 0 is at the bottom

    // Draw bars (ensuring all categories are represented)
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.fuelType))
        .attr("y", d => yScale(d.totalCapacity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.totalCapacity))
        .attr("fill", d => fuelColors[d.fuelType]); // Assign color based on fuel type

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        // .tickSize(0)
        .attr("color",  mystyle.getPropertyValue("--ter_color"))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end");
    
    svg.append("g").call(d3.axisLeft(yScale))

    d3.select("#chart-container")
        .insert("div", ":first-child")
        .attr("class", "graph-type")
        .html('Capacity by Fuel Type <span id="graph-unit-id">Megawatts</span>');
    
    // svg.append("g")
    //     .call(d3.axisBottom(xScale).tickSize(0))

    const textElements = svg.selectAll("text");
    const pathAndLineElements = svg.selectAll("path, line");

    textElements.style("fill", mystyle.getPropertyValue("--sec_color"));   // Change text color
    pathAndLineElements.style("stroke", mystyle.getPropertyValue("--ter_color"));  // Change line/path color

}