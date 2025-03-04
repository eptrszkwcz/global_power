import { numberWithCommas } from './utilities.js';
import { getCountryPopulation } from './populationAPI.js'

var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

export function process_FuelType(fFeatures){
    let fuelData = fFeatures.reduce((acc, feature) => {
        let fuelType = feature.properties.primary_fuel;
        let capacity = parseInt(feature.properties.capacity_mw) || 0; // Ensure it's a number

        if (!acc[fuelType]) {
            acc[fuelType] = { count: 0, totalCapacity: 0 };
        }

        acc[fuelType].count += 1; // Increment count
        acc[fuelType].totalCapacity += capacity; // Sum capacity

        return acc;
    }, {});   
    return fuelData
}


// GRAPH - YEAR BUILT -o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-

export function process_Renewable(fFeatures) {
    if (!Array.isArray(fFeatures) || fFeatures.length === 0) {
        console.warn("process_fuel: No features provided or invalid input.");
        return {
            fuelTypes: {},
            totalRenewable: 0,
            totalNonRenewable: 0,
            totalNuclear: 0,
            totalOther: 0
        };
    }

    const renewableSources = {
        "Biomass": true,
        "Coal": false,
        "Gas": false,
        "Geothermal": true,
        "Hydro": true,
        "Oil": false,
        "Solar": true,
        "Tidal": true,
        "Wind": true
    };

    let fuelData = {
        fuelTypes: {},
        totalRenewable: 0,
        totalNonRenewable: 0,
        totalNuclear: 0,
        totalOther: 0, 
        totalCapacity: 0,
        percRenewable: 0,
        percNonRenewable: 0,
        percNuclear: 0,
    };

    let hasRenewable = false;
    let hasNonRenewable = false;
    let hasNuclear = false;

    fFeatures.forEach(feature => {
        let fuelType = feature.properties?.primary_fuel || "Other";
        let capacity = parseFloat(feature.properties?.capacity_mw) || 0;

        if (!fuelData.fuelTypes[fuelType]) {
            fuelData.fuelTypes[fuelType] = { count: 0, totalCapacity: 0 };
        }

        fuelData.fuelTypes[fuelType].count += 1;
        fuelData.fuelTypes[fuelType].totalCapacity += capacity;

        if (fuelType === "Other") {
            fuelData.totalOther += capacity;
        } else if (fuelType === "Nuclear") {
            fuelData.totalNuclear += capacity;
            hasNuclear = true;
        } else if (renewableSources[fuelType]) {
            fuelData.totalRenewable += capacity;
            hasRenewable = true;
        } else {
            fuelData.totalNonRenewable += capacity;
            hasNonRenewable = true;
        }
    });

    // Ensure all categories are explicitly set to 0 if missing
    if (!hasRenewable) fuelData.totalRenewable = 0;
    if (!hasNonRenewable) fuelData.totalNonRenewable = 0;
    if (!hasNuclear) fuelData.totalNuclear = 0;

    fuelData.totalCapacity = fuelData.totalRenewable + fuelData.totalNonRenewable +fuelData.totalNuclear
    fuelData.percNonRenewable = parseFloat(((fuelData.totalNonRenewable/fuelData.totalCapacity)*100).toFixed(1))
    fuelData.percRenewable = parseFloat(((fuelData.totalRenewable/fuelData.totalCapacity)*100).toFixed(1))
    fuelData.percNuclear = parseFloat(((fuelData.totalNuclear/fuelData.totalCapacity)*100).toFixed(1))

    return fuelData;
}

export function chart_FuelType(countryData) {
    const fuelCategories = [
        "Geothermal", "Tidal", "Hydro", "Wind", "Solar", "Biomass", "Oil",
        "Gas", "Coal", "Other"
    ];

    // Initialize the "Other" category to store fuel types not in fuelCategories
    const otherData = { count: 0, totalCapacity: 0 };

    // Calculate total capacity including all categories, and group non-listed categories into "Other"
    const totalCapacity = Object.entries(countryData).reduce((acc, [fuelType, values]) => {
        if (fuelCategories.includes(fuelType)) {
            acc += values.totalCapacity;
        } else {
            // Group non-listed fuel types into "Other"
            otherData.totalCapacity += values.totalCapacity;
        }
        return acc;
    }, 0);

    // Now include "Other" in the total capacity
    const totalCapacityIncludingOther = totalCapacity + otherData.totalCapacity;

    // Normalize energy data as percentages of the total capacity, including "Other"
    const normalizedData = {};

    // Loop over the fuel categories to normalize them
    fuelCategories.forEach(category => {
        if (category !== "Other" && countryData[category]) {
            normalizedData[category] = countryData[category].totalCapacity / totalCapacityIncludingOther;
        }
    });

    // Add "Other" with its normalized value
    normalizedData["Other"] = otherData.totalCapacity / totalCapacityIncludingOther;

    const width = 392;
    const barHeight = 60;
    const margin = { left: 4, right: 4, top: 20, bottom: 20 };

    // Remove existing SVG to prevent duplicates
    d3.select("#chart-container").selectAll("svg").remove();
    d3.select("#chart-container").selectAll("div").remove();

    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", barHeight + 10 + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 1]) // Percentage range (0 to 100%)
        .range([0, width]);

    const colors = {
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
        "Other": "#a8a8a8" // "Other" is included in the chart and normalization
    };

    d3.select("#chart-container")
        .insert("div", ":first-child")
        .attr("class", "graph-type")
        .html('Capacity by Fuel Type <span class="graph-unit-id">Megawatts</span>');

    // Draw the stacked bar chart with the given order and normalized data
    drawStackedBar_fuel(svg, normalizedData, 0, width, barHeight, xScale, colors, fuelCategories);
}


export function drawStackedBar_fuel(svg, data, yPosition, width, barHeight, xScale, colors, fuelCategories) {
    let xOffset = 0;

    // Create a group for the entire bar to apply border correctly
    const barGroup = svg.append("g");

    // Loop through fuelCategories to create the stacked segments, in the specified order
    fuelCategories.forEach(category => {
        // Only draw if the category exists in the data (not "Other")
        if (category !== "Other" && data[category] !== undefined) {
            barGroup.append("rect")
                .attr("x", xScale(xOffset))
                .attr("y", yPosition)
                .attr("width", xScale(data[category]))
                .attr("height", barHeight)
                .attr("fill", colors[category])
                .attr("opacity", 0.6); // You can adjust opacity here

            xOffset += data[category];
        }
    });

    // If there's "Other" data, draw it at the end
    if (data["Other"] !== undefined) {
        barGroup.append("rect")
            .attr("x", xScale(xOffset))
            .attr("y", yPosition)
            .attr("width", xScale(data["Other"]))
            .attr("height", barHeight)
            .attr("fill", colors["Other"])
            .attr("opacity", 0.6);

        xOffset += data["Other"];
    }

}


export function chart_CapPerPop(customCountryName, customEnergyData, isocode){
    getCountryPopulation(isocode).then(population => {
        // console.log(`pop: ${population}`);
        chart_CapPerPop_prelim(customCountryName, customEnergyData, population)
      });

}

export function chart_CapPerPop_prelim(customCountryName, customEnergyData, customPopulation) {
    const continentPopulation = [
        { Continent: "Asia", population: 4810000000, percpop: 58.89, total_capacity: 2702747 },
        { Continent: "Africa", population: 1520000000, percpop: 18.56, total_capacity: 158493 },
        { Continent: "Europe", population: 743000000, percpop: 9.11, total_capacity: 1058006 },
        { Continent: "N America", population: 613000000, percpop: 7.51, total_capacity: 1430915 },
        { Continent: "S America", population: 436000000, percpop: 5.34, total_capacity: 271349 },
        { Continent: "Oceania", population: 46500000, percpop: 0.57, total_capacity: 73251 }
    ];
    
    // Normalize total_capacity by population
    continentPopulation.forEach(d => {
        d.normalized_capacity = Math.round((d.total_capacity / d.population) * 1000000);
    });

    // If a custom country is provided, calculate its normalized total capacity
    if (customEnergyData && customPopulation > 0) {
        const totalCapacity = Object.values(customEnergyData).reduce((sum, source) => sum + source.totalCapacity, 0);
        const normalizedCapacity = Math.round((totalCapacity / customPopulation) * 1000000);
        console.log(normalizedCapacity)

        // Add the custom country object
        continentPopulation.push({ Continent: customCountryName, population: customPopulation, total_capacity: totalCapacity, normalized_capacity: normalizedCapacity });
    }

    

    // Sort by normalized capacity (highest to lowest)
    continentPopulation.sort((a, b) => b.normalized_capacity - a.normalized_capacity);

    const barHeight = 25;
    const barSpacing = 10;
    const width = 240;
    const height = (barHeight + barSpacing) * continentPopulation.length;
    const margin = { top: 20, right: 80, bottom: 40, left: 80 };

    // Clear previous chart
    // d3.select("#chart-container").select("svg").remove();
    // d3.select("#chart-container").selectAll("div").remove();

    // Create new SVG
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scale
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(continentPopulation, d => d.normalized_capacity)])
        .range([0, width]);

    // Bars
    const bars = svg.selectAll(".bar")
        .data(continentPopulation)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * (barHeight + barSpacing)})`);

    bars.append("rect")
        .attr("class", "bar")
        .attr("width", d => xScale(d.normalized_capacity))
        .attr("height", barHeight)
        .attr("opacity", d => d.Continent === customCountryName ? 0.9 : 0.4)
        .attr("fill", d => d.Continent === customCountryName ? "var(--prim_color)" : "var(--ter_color)"); // Highlight custom country

    bars.append("text")
        .attr("class", "label")
        .attr("x", -10)
        .attr("y", barHeight / 2)
        .attr("text-anchor", "end")
        .attr("dy", ".35em")
        .attr("font-size", "14px")
        .attr("fill", "var(--ter_color)")
        .text(d => d.Continent);

    bars.append("text")
        .attr("class", "value")
        .attr("x", d => xScale(d.normalized_capacity) + 5)
        .attr("text-anchor", "start")
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("fill", d => d.Continent === customCountryName ? "white" : "var(--ter_color)")
        .text(d => numberWithCommas(d.normalized_capacity));

    d3.select("#chart-container")
        .insert("div", ":nth-child(2)")
        .attr("class", "graph-type")
        .html('Capacity per Capita <span class="graph-unit-id">Watts per Person</span>');
}



// GRAPH - RENEWABLE FUEL TYPES -o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-

export function chart_Renewable(countryData) {
    let continentData = [
        { continent: "Asia", Renewable: 22.04, Nuclear: 4.27, Nonrenewable: 73.69 },
        { continent: "Europe", Renewable: 30.80, Nuclear: 15.91, Nonrenewable: 53.29 },
        { continent: "Africa", Renewable: 25.47, Nuclear: 1.12, Nonrenewable: 73.41 },
        { continent: "S America", Renewable: 70.08, Nuclear: 1.39, Nonrenewable: 28.53 },
        { continent: "Oceania", Renewable: 34.16, Nuclear: 0.00, Nonrenewable: 65.84 },
        { continent: "N America", Renewable: 26.54, Nuclear: 8.49, Nonrenewable: 64.98 }
    ]

    // Sort continents by Renewable percentage (descending order)
    continentData.sort((a, b) => b.Renewable - a.Renewable);
    
    // Add countryData to be inserted dynamically in the sorted list
    if (countryData) {
        continentData.push(countryData);
        continentData.sort((a, b) => b.Renewable - a.Renewable);
    }

    const width = 320;
    const barHeight = 40;
    const margin = { left: 80, right: 4, top: 20, bottom: 20 };

    // Remove existing SVG to prevent duplicates
    d3.select("#chart-container").selectAll("svg").remove();
    d3.select("#chart-container").selectAll("div").remove();

    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", (barHeight + 10) * continentData.length + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(continentData.map(d => d.continent))
        .range([0, (barHeight + 10) * continentData.length])
        .padding(0.1);

    const colors = { "Renewable": "rgba(0, 222, 141, 0.6)", "Nuclear": "rgba(179, 30, 92, 0.6)", "Nonrenewable": "rgba(255, 0, 93, 0.7)" };

    continentData.forEach((d, i) => {
        drawStackedBar(svg, d, yScale(d.continent), width, barHeight, xScale, colors, d.continent === "Custom Country");
    });

    svg.selectAll(".continent-label")
        .data(continentData)
        .enter()
        .append("text")
        .attr("class", "continent-label")
        .attr("x", -margin.left)
        .attr("y", d => yScale(d.continent) + barHeight / 2 + 5)
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .attr("fill", "var(--ter_color)")
        .text(d => d.continent === "Custom Country" ? "" : d.continent);
    
    d3.select("#chart-container")
        .insert("div", ":nth-last-child(2)")
        .attr("class", "graph-type")
        .html('Percent of Capacity from Renewable Fuels <span class="graph-unit-id">%</span>');
}

// DRAWS STACKED BARCHART FOR RENEWABLE
export function drawStackedBar(svg, data, yPosition, width, barHeight, xScale, colors, isCustom) {
    let xOffset = 0;
    const categories = ["Renewable", "Nuclear", "Nonrenewable"];

    // Create a group for the entire bar to apply border correctly
    const barGroup = svg.append("g");

    categories.forEach(category => {
        barGroup.append("rect")
            .attr("x", xScale(xOffset))
            .attr("y", yPosition)
            .attr("width", xScale(data[category]))
            .attr("height", barHeight)
            .attr("fill", colors[category])
            .attr("opacity", isCustom ? 0.9 : 0.6);
        
        xOffset += data[category];
    });

    // Add percentage label for Renewable on top of the draw order
    barGroup.append("text")
        .attr("x", xScale(data["Renewable"] / 2))
        .attr("y", yPosition + barHeight / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", isCustom ? "white" : "var(--sec_color)")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`${data["Renewable"].toFixed(1)}%`);

    // Apply white border only to the exterior of the entire custom bar
    if (isCustom) {
        barGroup.append("rect")
            .attr("x", 0)
            .attr("y", yPosition)
            .attr("width", xScale(100))
            .attr("height", barHeight)
            .attr("fill", "none")
            .attr("stroke", "var(--prim_color)")
            .attr("stroke-width", 1);
    }
}

// GRAPH - YEAR BUILT -o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-

export function chart_YearBuilt(fFeatures) {
    let cont_date_data = [
        { "continent": "Africa", "min": 1930, "Q1": 1981, "median": 2005, "Q3": 2014, "max": 2018, "chart_min": 1931.5 },
        { "continent": "Asia", "min": 1927, "Q1": 1998, "median": 2008, "Q3": 2012, "max": 2018, "chart_min": 1977 },
        { "continent": "Europe", "min": 1900, "Q1": 1966, "median": 1995, "Q3": 2007, "max": 2018, "chart_min": 1904.5 },
        { "continent": "N America", "min": 1896, "Q1": 1988, "median": 2007, "Q3": 2016, "max": 2020, "chart_min": 1946 },
        { "continent": "Oceania", "min": 1914, "Q1": 1975, "median": 2004, "Q3": 2008, "max": 2015, "chart_min": 1925.5 },
        { "continent": "S America", "min": 1900, "Q1": 2001, "median": 2009, "Q3": 2014, "max": 2017, "chart_min": 1981.5 }
    ];

    // Extract commissioning years from fFeatures
    let customYears = fFeatures
    .map(d => d.properties.commissioning_year)
    .filter(y => y !== undefined && y !== null); // Ensure valid years

    if (customYears.length > 0) {
        customYears.sort((a, b) => a - b);

        // Compute quartiles once
        let Q1 = d3.quantile(customYears, 0.25) ?? customYears[0];
        let Q3 = d3.quantile(customYears, 0.75) ?? customYears[customYears.length - 1];
        let IQR = Q3 - Q1; // Interquartile range

        let customBox = {
            "continent": "Custom Selection",
            "min": customYears[0],
            "Q1": Q1,
            "median": d3.median(customYears) ?? customYears[Math.floor(customYears.length / 2)],
            "Q3": Q3,
            "max": customYears[customYears.length - 1],
            "chart_min": Q1 - (IQR * 1.5)
        };

        // If chart_min is less than min, set chart_min to min
        customBox.chart_min = Math.max(customBox.chart_min, customBox.min);

        cont_date_data.push(customBox);
    }


    // Sort by median, newest at top
    cont_date_data.sort((a, b) => b.median - a.median);

    const margin = { left: 80, right: 60, top: 20, bottom: 20 },
          width = 404 - margin.left - margin.right,
          height = (40 + 10) * cont_date_data.length;
    
    d3.select("#chart-container").selectAll("svg").remove();
    d3.select("#chart-container").selectAll("div").remove();
  
    const svg = d3.select("#chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
      .domain(cont_date_data.map(d => d.continent))
      .range([0, height])
      .padding(0.3);

    const xScale = d3.scaleLinear()
      .domain([1890, 2022])
      .range([0, width]);

    cont_date_data.forEach((d) => {
        drawBoxPlot(svg, yScale(d.continent), width, d, xScale, margin, d.continent === "Custom Selection");
    });

     svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
        .tickValues([1900, 1920, 1940, 1960, 1980, 2000, 2020])
        .tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("fill", "var(--ter_color)");

    // svg.append("g").call(d3.axisLeft(yScale));
    // svg.append("g")
    //   .attr("transform", `translate(0,${height})`)
    //   .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
}


export function drawBoxPlot(svg, yPosition, width, data, xScale, margin, isCustom) {
    const { min, Q1, median, Q3, max, chart_min } = data;
    
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%").attr("x2", "100%")
        .attr("y1", "0%").attr("y2", "0%");


    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#fa00f6")
    gradient.append("stop").attr("offset", "58%").attr("stop-color", "rgb(98, 0, 163)")
    gradient.append("stop").attr("offset", "78%").attr("stop-color", "rgb(59, 80, 196)")
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgb(47, 252, 28)")

    // gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgb(98, 0, 163)")
    // gradient.append("stop").attr("offset", "78%").attr("stop-color", "rgb(59, 80, 196)")
    // gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgb(47, 252, 28)")

    // .attr("opacity", isCustom ? 0.9 : 0.6);

    svg.append("rect")
        .attr("x", 0)
        .attr("width", width)
        .attr("y", yPosition - 20)
        .attr("height", 40)
        .attr("opacity",isCustom ? 0.5 : 0.2)
        .style("fill", "url(#gradient)");

    svg.append("line")
        .attr("x1", xScale(chart_min))
        .attr("x2", xScale(Q1))
        .attr("y1", yPosition)
        .attr("y2", yPosition)
        .attr("stroke", isCustom ? "var(--sec_color)" : "var(--ter_color)")
        .attr("stroke-width", 1);

    svg.append("line")
        .attr("x1", xScale(Q3))
        .attr("x2", xScale(max))
        .attr("y1", yPosition)
        .attr("y2", yPosition)
        .attr("stroke", isCustom ? "var(--sec_color)" : "var(--ter_color)")
        .attr("stroke-width", 1);
    
    svg.append("rect")
        .attr("x", xScale(Q1))
        .attr("width", xScale(Q3) - xScale(Q1))
        .attr("y", yPosition - 17)
        .attr("height", 34)
        .attr("stroke", isCustom ? "var(--prim_color)" : "var(--ter_color)")
        .attr("fill", "none")
        .attr("rx", 4)     // X-axis corner radius
        .attr("ry", 4);

    svg.append("line")
        .attr("x1", xScale(median))
        .attr("x2", xScale(median))
        .attr("y1", yPosition - 16)
        .attr("y2", yPosition + 16)
        .attr("stroke", isCustom ? "white" : "var(--ter_color)")
        .attr("stroke-width", 1);

    [chart_min, max].forEach((value) => {
        svg.append("line")
            .attr("x1", xScale(value))
            .attr("x2", xScale(value))
            .attr("y1", yPosition - 5)
            .attr("y2", yPosition + 5)
            .attr("stroke", isCustom ? "var(--prim_color)" : "var(--ter_color)")
            .attr("stroke-width", 1);
    });

    [min].forEach((value) => {
        svg.append("line")
            .attr("x1", xScale(value))
            .attr("x2", xScale(value))
            .attr("y1", yPosition - 2)
            .attr("y2", yPosition + 2)
            .attr("stroke", isCustom ? "var(--prim_color)" : "var(--ter_color)")
            .attr("stroke-width", 1);
        svg.append("line")
            .attr("x1", xScale(value)-2)
            .attr("x2", xScale(value)+2)
            .attr("y1", yPosition)
            .attr("y2", yPosition)
            .attr("stroke", isCustom ? "var(--prim_color)" : "var(--ter_color)")
            .attr("stroke-width", 1);
    });

    svg.append("text")
        .attr("x", -10)
        .attr("y", yPosition + 5)
        .attr("text-anchor", "end")
        .attr("font-size", "14px")
        .attr("fill", "var(--ter_color)")
        .text(data.continent === "Custom Selection" ? "" : data.continent);
    
    svg.append("text")
        .attr("x", xScale(2022) + 12) // Positioning slightly to the right of the max line
        .attr("y", yPosition + 5)
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .attr("fill", isCustom ? "var(--prim_color)" : "var(--ter_color)")
        .text(median);
}




       

// export function drawBarChart(fuelData, countryName) {
    //     // console.log(fuelData)
    //     // Define the known fuel categories in the correct order
    //     const fuelCategories = [
    //         "Coal", "Gas", "Oil", "Biomass", "Geothermal", "Tidal",
    //         "Hydro", "Wind", "Solar", "Nuclear", "Other"
    //     ];
    
    //     // Define a color mapping for each fuel type
    //     const fuelColors = {
    //         "Biomass": "#9e5418",
    //         "Coal": "#fc0303",
    //         "Gas": "#e01075",
    //         "Geothermal": "#8800ff",
    //         "Hydro": "#0398fc",
    //         "Nuclear": "#ff00f7",
    //         "Oil": "#eb7f7f",
    //         "Solar": "#e3bb0e",
    //         "Tidal": "#1859c9",
    //         "Wind": "#12c474",
    //         "Other": "#a8a8a8"
    //     };
    
    //     // Create a default object with all categories set to zero
    //     let defaultFuelData = fuelCategories.reduce((acc, fuelType) => {
    //         acc[fuelType] = { count: 0, totalCapacity: 0 };
    //         return acc;
    //     }, {});
    
    //     // List of fuel types that should be grouped under "Other"
    //     const knownFuelTypes = new Set(fuelCategories.slice(0, -1)); // Everything except "Other"
    
    //     // Merge actual fuel data with default structure, grouping unknowns into "Other"
    //     for (const [fuelType, values] of Object.entries(fuelData)) {
    //         const category = knownFuelTypes.has(fuelType) ? fuelType : "Other";
    //         defaultFuelData[category].count += values.count;
    //         defaultFuelData[category].totalCapacity += values.totalCapacity;
    //     }
    
    //     // Convert mergedFuelData into an array, keeping the desired order
    //     let data = fuelCategories.map(fuelType => ({
    //         fuelType,
    //         totalCapacity: Number(defaultFuelData[fuelType].totalCapacity) || 0
    //     }));
    
    //     if (data.length === 0) {
    //         console.warn("No data available for", countryName);
    //         return;
    //     }
    
    //     // Set up chart dimensions
    //     const width = 320;
    //     const height = 300;
    //     const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    
    //     d3.select("#chart-container").selectAll("svg").remove();
    //     d3.select("#chart-container").selectAll("div").remove();
    
    //     const svg = d3.select("#chart-container")
    //         .append("svg")
    //         .attr("width", width + margin.left + margin.right)
    //         .attr("height", height + margin.top + margin.bottom)
    //         .append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);
    
    //     // X Scale (respects the predefined order)
    //     const xScale = d3.scaleBand()
    //         .domain(fuelCategories) // Use predefined fuel order
    //         .range([0, width])
    //         .padding(0.3);
    
    //     const maxCapacity = d3.max(data, d => d.totalCapacity) || 1;
    //     const yScale = d3.scaleLinear()
    //         .domain([0, maxCapacity])
    //         .nice()
    //         .range([height, 0]); // Ensure 0 is at the bottom
    
    //     // Draw bars (ensuring all categories are represented)
    //     svg.selectAll(".bar")
    //         .data(data)
    //         .enter()
    //         .append("rect")
    //         .attr("class", "bar")
    //         .attr("x", d => xScale(d.fuelType))
    //         .attr("y", d => yScale(d.totalCapacity))
    //         .attr("width", xScale.bandwidth())
    //         .attr("height", d => height - yScale(d.totalCapacity))
    //         .attr("fill", d => fuelColors[d.fuelType]); // Assign color based on fuel type
    
    //     svg.append("g")
    //         .attr("transform", `translate(0,${height})`)
    //         .call(d3.axisBottom(xScale).tickSize(0))
    //         // .tickSize(0)
    //         .attr("color",  mystyle.getPropertyValue("--ter_color"))
    //         .selectAll("text")
    //         .attr("transform", "rotate(-40)")
    //         .style("text-anchor", "end");
        
    //     svg.append("g").call(d3.axisLeft(yScale))
    
    //     d3.select("#chart-container")
    //         .insert("div", ":first-child")
    //         .attr("class", "graph-type")
    //         .html('Capacity by Fuel Type <span id="graph-unit-id">Megawatts</span>');
        
    //     // svg.append("g")
    //     //     .call(d3.axisBottom(xScale).tickSize(0))
    
    //     const textElements = svg.selectAll("text");
    //     const pathAndLineElements = svg.selectAll("path, line");
    
    //     textElements.style("fill", mystyle.getPropertyValue("--sec_color"));   // Change text color
    //     pathAndLineElements.style("stroke", mystyle.getPropertyValue("--ter_color"));  // Change line/path color
    
    // }
    
    
    
  
  










