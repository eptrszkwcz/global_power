var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

export function process_fuel(fFeatures){
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

export function process_renew(fFeatures) {
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
        totalOther: 0
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

    return fuelData;
}




export function drawBarChart(fuelData, countryName) {
    // console.log(fuelData)
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


// export function drawRenewChart(fuelData) {
//     // Compute total excluding "Other"
//     const totalValidCapacity = fuelData.totalRenewable + fuelData.totalNonRenewable + fuelData.totalNuclear;

//     // Create ordered data structure: Renewable -> Nuclear -> Non-Renewable
//     const data = [
//         { category: "Renewable", value: fuelData.totalRenewable, color: "#4CAF50" }, // Green
//         { category: "Nuclear", value: fuelData.totalNuclear, color: "#8B0000" }, // Dark Red
//         { category: "Non-Renewable", value: fuelData.totalNonRenewable, color: "#F44336" } // Red
//     ];

//     // Convert to percentage
//     data.forEach(d => d.percentage = (d.value / totalValidCapacity) * 100);
//     console.log(data)

//     // Set up SVG dimensions
//     const width = 200;
//     const height = 50;
//     const margin = { left: 60, right: 10, top: 20, bottom: 20 };

//     d3.select("#chart-container").select("svg").remove();
//     d3.select("#chart-container").selectAll("div").remove();

//     // Create SVG container
//     const svg = d3.select("#chart-container")
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom);

//     // Create a group for the bar
//     const barGroup = svg.append("g")
//         .attr("transform", `translate(${margin.left}, ${margin.top})`);

//     // Define a scale for width
//     const xScale = d3.scaleLinear()
//         .domain([0, 100]) // Percentage-based
//         .range([0, width - margin.left - margin.right]);

//     let xOffset = 0; // Track position of each segment

//     // Draw stacked bar segments
//     barGroup.selectAll("rect")
//         .data(data)
//         .enter()
//         .append("rect")
//         .attr("x", d => xScale(xOffset))
//         .attr("y", 0)
//         .attr("width", d => xScale(d.percentage))
//         .attr("height", height)
//         .attr("fill", d => d.color)
//         .each(d => xOffset += d.percentage); // Update offset

//     // Reset offset for text placement
//     xOffset = 0; 

//     // Add labels inside each segment
//     barGroup.selectAll("text")
//         .data(data)
//         .enter()
//         .append("text")
//         .attr("x", d => xScale(xOffset + d.percentage / 2)) // Center text
//         .attr("y", height / 2 + 5)
//         .attr("text-anchor", "middle")
//         .attr("fill", "white")
//         .attr("font-size", "14px")
//         .attr("font-weight", "bold")
//         .text(d => `${d.percentage.toFixed(1)}%`)
//         .each(d => xOffset += d.percentage); // Update offset

//     // Add Renewable Percentage Text to the Left
//     svg.append("text")
//         .attr("x", 10) // Left side of the bar
//         .attr("y", height / 2 + margin.top)
//         .attr("fill", "#4CAF50") // Green color
//         .attr("font-size", "16px")
//         .attr("font-weight", "bold")
//         .attr("text-anchor", "end")
//         .text(`${data[0].percentage.toFixed(1)}% Renewable`);
// }


// import * as d3 from "d3";

export function drawRenewChart(fuelData) {
    // Compute total excluding "Other"
    const totalValidCapacity = fuelData.totalRenewable + fuelData.totalNonRenewable + fuelData.totalNuclear;

    if (totalValidCapacity === 0) {
        console.warn("No valid energy capacity data to display.");
        return;
    }

    // Define ordered data structure: Renewable -> Nuclear -> Non-Renewable
    const data = [
        { category: "Renewable", value: fuelData.totalRenewable, color: "rgba(0, 222, 141, 0.6)" }, // Green
        { category: "Nuclear", value: fuelData.totalNuclear, color: "rgba(179, 30, 92, 0.6)" }, // Dark Red
        { category: "Non-Renewable", value: fuelData.totalNonRenewable, color: "rgba(255, 0, 93, 0.7)" } // Red
    ];

    // Convert to percentage
    data.forEach(d => d.percentage = (d.value / totalValidCapacity) * 100);


    // Set up SVG dimensions
    const width = 400;
    const height = 50;
    const margin = { left: 0, right: 0, top: 20, bottom: 20 };

    // Remove existing SVG to prevent duplicates
    d3.select("#chart-container").select("svg").remove();

    // Create SVG container
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    // Create a group for the bar
    const barGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define a scale for width
    const xScale = d3.scaleLinear()
        .domain([0, 100]) // Percentage-based
        .range([0, width - margin.left - margin.right]);

    let xOffset = 0; // Track position of each segment

    // Draw stacked bar segments
    barGroup.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => {
            const x = xScale(xOffset);
            xOffset += d.percentage;
            return x;
        })
        .attr("y", 0)
        .attr("width", d => xScale(d.percentage))
        .attr("height", height)
        .attr("fill", d => d.color);

    // Reset xOffset for text placement
    xOffset = 0;

    // Add labels inside each segment
    barGroup.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => {
            const x = xScale(xOffset + d.percentage / 2); // Center text
            xOffset += d.percentage;
            return x;
        })
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(d => d.percentage > 5 ? `${d.percentage.toFixed(1)}%` : ""); // Hide small labels

    // Add Renewable Percentage Text to the Left
    // svg.append("text")
    //     .attr("x", margin.left - 10) // Position left of the bar
    //     .attr("y", height / 2 + margin.top)
    //     .attr("fill", "#4CAF50") // Green color
    //     .attr("font-size", "16px")
    //     .attr("font-weight", "bold")
    //     .attr("text-anchor", "end")
    //     .text(`${data[0].percentage.toFixed(1)}% Renewable`);
}

// Example Usage (Ensure `fuelData` is available)
// drawStackedBarChart(fuelData);


// export function drawStackedBar(svg, data, yPosition, width, barHeight, xScale, colors) {
//     let xOffset = 0;
//     const categories = ["Renewable", "Nuclear", "Nonrenewable"];

//     categories.forEach(category => {
//         svg.append("rect")
//             .attr("x", xScale(xOffset))
//             .attr("y", yPosition)
//             .attr("width", xScale(data[category]))
//             .attr("height", barHeight)
//             .attr("fill", colors[category]);
//         xOffset += data[category];
//     });

//     // svg.append("text")
//     //     .attr("x", -10)
//     //     .attr("y", yPosition + barHeight / 2 + 5)
//     //     .attr("fill", "#4CAF50")
//     //     .attr("font-size", "14px")
//     //     .attr("font-weight", "bold")
//     //     .attr("text-anchor", "end")
//     //     .text(`${data.Renewable.toFixed(1)}%`);
// }

// export function drawContinentEnergyChart(continentData, countryData) {
//     // Sort continents by Renewable percentage (descending order)
//     continentData.sort((a, b) => b.Renewable - a.Renewable);
    
//     // Add countryData to be inserted dynamically in the sorted list
//     if (countryData) {
//         continentData.push(countryData);
//         continentData.sort((a, b) => b.Renewable - a.Renewable);
//     }

//     const width = 320;
//     const barHeight = 40;
//     const margin = { left: 80, right: 0, top: 20, bottom: 20 };

//     const svg = d3.select("#chart-container")
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", (barHeight + 10) * continentData.length + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

//     const xScale = d3.scaleLinear()
//         .domain([0, 100])
//         .range([0, width]);

//     const yScale = d3.scaleBand()
//         .domain(continentData.map(d => d.continent))
//         .range([0, (barHeight + 10) * continentData.length])
//         .padding(0.1);

//     const colors = { "Renewable": "rgba(0, 222, 141, 0.6)", "Nuclear": "rgba(179, 30, 92, 0.6)", "Nonrenewable": "rgba(255, 0, 93, 0.7)" };

//     continentData.forEach((d, i) => {
//         drawStackedBar(svg, d, yScale(d.continent), width, barHeight, xScale, colors);
//     });

//     svg.selectAll(".continent-label")
//         .data(continentData)
//         .enter()
//         .append("text")
//         .attr("x", -margin.left + 10)
//         .attr("y", d => yScale(d.continent) + barHeight / 2 + 5)
//         .attr("text-anchor", "start")
//         .attr("font-size", "14px")
//         .text(d => d.continent);
// }

// Example Usage

// import * as d3 from "d3";

export function drawStackedBar(svg, data, yPosition, width, barHeight, xScale, colors, isCustom) {
    let xOffset = 0;
    const categories = ["Renewable", "Nuclear", "Nonrenewable"];

    categories.forEach(category => {
        svg.append("rect")
            .attr("x", xScale(xOffset))
            .attr("y", yPosition)
            .attr("width", xScale(data[category]))
            .attr("height", barHeight)
            .attr("fill", colors[category])
            .attr("opacity", isCustom ? 1 : 0.7)
            .attr("stroke", isCustom ? "white" : "none")
            .attr("stroke-width", isCustom ? 2 : 0);
        
        svg.append("text")
            .attr("x", xScale(xOffset + data[category] / 2))
            .attr("y", yPosition + barHeight / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(`${data[category].toFixed(1)}%`);
        
        xOffset += data[category];
    });
}

export function drawContinentEnergyChart(continentData, countryData) {
    // Sort continents by Renewable percentage (descending order)
    continentData.sort((a, b) => b.Renewable - a.Renewable);
    
    // Add countryData to be inserted dynamically in the sorted list
    if (countryData) {
        continentData.push(countryData);
        continentData.sort((a, b) => b.Renewable - a.Renewable);
    }

    const width = 320;
    const barHeight = 40;
    const margin = { left: 80, right: 0, top: 20, bottom: 20 };

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
        .attr("x", -margin.left + 10)
        .attr("y", d => yScale(d.continent) + barHeight / 2 + 5)
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .text(d => d.continent);
}

// // Example Usage
// drawContinentEnergyChart([
//     { continent: "Asia", Renewable: 22.04, Nuclear: 4.27, Nonrenewable: 73.69 },
//     { continent: "Europe", Renewable: 30.80, Nuclear: 15.91, Nonrenewable: 53.29 },
//     { continent: "Africa", Renewable: 25.47, Nuclear: 1.12, Nonrenewable: 73.41 },
//     { continent: "South America", Renewable: 70.08, Nuclear: 1.39, Nonrenewable: 28.53 },
//     { continent: "Oceania", Renewable: 34.16, Nuclear: 0.00, Nonrenewable: 65.84 },
//     { continent: "North America", Renewable: 26.54, Nuclear: 8.49, Nonrenewable: 64.98 }
// ],
// { continent: "Custom Country", Renewable: 40.00, Nuclear: 5.00, Nonrenewable: 55.00 });




