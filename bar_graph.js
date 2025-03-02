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
            .attr("stroke", "var(--sec_color)")
            .attr("stroke-width", 1);
    }
}

export function drawContinentEnergyChart(countryData) {
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
    d3.select("#chart-container").select("svg").remove();

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
        .attr("fill", "var(--ter_color)")
        .text(d => d.continent === "Custom Country" ? "" : d.continent);
}


export function drawBoxPlot(fFeatures) {
    const margin = { top: 20, right: 30, bottom: 40, left: 20 },
          width = 400 - margin.left - margin.right,
          height = 100;
  
    const svg = d3.select("#chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const commissioningYears = fFeatures.map(d => d.properties.commissioning_year).filter(d => d);
    commissioningYears.sort(d3.ascending);
    console.log(commissioningYears)
  
    const q1 = d3.quantile(commissioningYears, 0.25);
    const median = d3.quantile(commissioningYears, 0.5);
    const q3 = d3.quantile(commissioningYears, 0.75);
    const min = d3.min(commissioningYears);
    const max = d3.max(commissioningYears);
  
    const x = d3.scaleLinear()
      .domain([1890, 2020])
      .range([0, width]);
  
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
  
    gradient.append("stop").attr("offset", `${(1960 - min) / (max - min) * 100}%`).attr("stop-color", "#6200a3");
    gradient.append("stop").attr("offset", `${(2000 - min) / (max - min) * 100}%`).attr("stop-color", "#3b50c4");
    gradient.append("stop").attr("offset", `${(2020 - min) / (max - min) * 100}%`).attr("stop-color", "#2efc1c");
  
    svg.append("rect")
      .attr("x", 0)
      .attr("width", width)
      .attr("y", height / 2 - 20)
      .attr("height", 40)
      .style("fill", "url(#gradient)");
  
    svg.append("line")
      .attr("x1", x(min))
      .attr("x2", x(q1))
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "white")
      .attr("stroke-width", 1);
    
    svg.append("line")
      .attr("x1", x(q3))
      .attr("x2", x(max))
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    svg.append("rect")
      .attr("x", x(q1))
      .attr("width", x(q3) - x(q1))
      .attr("y", height / 2 - 20)
      .attr("height", 40)
      .attr("stroke", "white")
      .attr("fill", "none");
  
    svg.append("line")
      .attr("x1", x(median))
      .attr("x2", x(median))
      .attr("y1", height / 2 - 20)
      .attr("y2", height / 2 + 20)
      .attr("stroke", "black")
      .attr("stroke-width", 3);
  
    svg.append("line")
      .attr("x1", x(min))
      .attr("x2", x(min))
      .attr("y1", height / 2 - 10)
      .attr("y2", height / 2 + 10)
      .attr("stroke", "white")
      .attr("stroke-width", 1);
  
    svg.append("line")
      .attr("x1", x(max))
      .attr("x2", x(max))
      .attr("y1", height / 2 - 10)
      .attr("y2", height / 2 + 10)
      .attr("stroke", "white")
      .attr("stroke-width", 1);
  
    svg.append("line")
      .attr("x1", x(q1))
      .attr("x2", x(q1))
      .attr("y1", height / 2 - 10)
      .attr("y2", height / 2 + 10)
      .attr("stroke", "white")
      .attr("stroke-width", 1);
  
    svg.append("line")
      .attr("x1", x(q3))
      .attr("x2", x(q3))
      .attr("y1", height / 2 - 10)
      .attr("y2", height / 2 + 10)
      .attr("stroke", "white")
      .attr("stroke-width", 1);
  
    const axis = d3.axisBottom(x).tickFormat(d3.format("d"));
    svg.append("g")
      .attr("transform", `translate(0,${height - 10})`)
      .call(axis);
  }


let cont_date_data = {
    "Africa": {"min":1930, "Q1": 1981, "median":2005, "Q3":2014, "max":2018},
    "Asia": {"min":1927, "Q1": 1998, "median":2007, "Q3":2012, "max":2018},
    "Europe": {"min":1900, "Q1": 1966, "median":1995, "Q3":2007, "max":2018},
    "North America": {"min":1896, "Q1": 1988, "median":2009, "Q3":2016, "max":2020},
    "Oceania": {"min":1914, "Q1": 1975, "median":2004, "Q3":2008, "max":2015},
    "South America": {"min":1900, "Q1": 2001, "median":2009, "Q3":2014, "max":2017},
}

// export function drawStackedBoxPlots(cont_date_data, customEntry = null) {
//     const margin = { top: 20, right: 30, bottom: 40, left: 100 },
//           width = 500 - margin.left - margin.right,
//           height = 300;

//     const data = Object.entries(cont_date_data).map(([continent, stats]) => ({
//         continent,
//         ...stats
//     }));

//     if (customEntry) {
//         data.push({ continent: "Custom", ...customEntry });
//     }

//     data.sort((a, b) => a.median - b.median);

//     const svg = d3.select("#chart-container")
//       .append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//       .attr("transform", `translate(${margin.left},${margin.top})`);

//     const x = d3.scaleLinear()
//       .domain([1890, 2020])
//       .range([0, width]);

//     const y = d3.scaleBand()
//       .domain(data.map(d => d.continent))
//       .range([height, 0])
//       .padding(0.4);

//     svg.append("g")
//       .attr("transform", `translate(0,${height})`)
//       .call(d3.axisBottom(x).tickFormat(d3.format("d")));

//     svg.append("g")
//       .call(d3.axisLeft(y));

//     data.forEach(d => {
//         const yPos = y(d.continent) + y.bandwidth() / 2;
        
//         svg.append("line")
//           .attr("x1", x(d.min))
//           .attr("x2", x(d.Q1))
//           .attr("y1", yPos)
//           .attr("y2", yPos)
//           .attr("stroke", "white")
//           .attr("stroke-width", 1);

//         svg.append("line")
//           .attr("x1", x(d.Q3))
//           .attr("x2", x(d.max))
//           .attr("y1", yPos)
//           .attr("y2", yPos)
//           .attr("stroke", "white")
//           .attr("stroke-width", 1);

//         svg.append("rect")
//           .attr("x", x(d.Q1))
//           .attr("width", x(d.Q3) - x(d.Q1))
//           .attr("y", yPos - y.bandwidth() / 3)
//           .attr("height", y.bandwidth() * 2 / 3)
//           .attr("stroke", "white")
//           .attr("fill", "none");

//         svg.append("line")
//           .attr("x1", x(d.median))
//           .attr("x2", x(d.median))
//           .attr("y1", yPos - y.bandwidth() / 3)
//           .attr("y2", yPos + y.bandwidth() / 3)
//           .attr("stroke", "black")
//           .attr("stroke-width", 3);
//     });
// }


   
  
  










