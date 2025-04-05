// Allow for variables in the css 
var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

// import * as d3 from "d3";
import { process_FuelType, process_Renewable, chart_Renewable, chart_YearBuilt, chart_FuelType, chart_CapPerPop} from './bar_graph.js';
import { zoom_to_bounds, getZoomLevel, numberWithCommas} from './utilities.js';
import { getCountryPopulation } from './populationAPI.js';

const filterGroup = document.getElementById('filter-group');

mapboxgl.accessToken = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNtOHMwbmJvdTA4ZnIya290M2hlbmswb2YifQ.qQZEM9FzU2J-_z0vYoSBeg';
 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/ptrszkwcz/cm7ppr7p6000401sncjoy9usq', // extra darlk
    // style: 'mapbox://styles/ptrszkwcz/clqmt03br00g201qrfnt9442u', // dark
    center: [62, 49], // starting position [lng, lat]
    zoom: 3, // starting zoom
    // maxZoom: 15,
    minZoom: 3
});


// Dont forget this part for Hover!
let hoveredPointId = null;
let hoveredPolygonId = null;
let clickedPointId = null;
let clickedPolygonId = null;
let countryName = null;
let viz_type = 0;


const cats = ['Biomass','Coal','Gas','Geothermal','Hydro','Nuclear','Oil','Solar','Tidal','Wind','Other'];
const other_cats = ['Storage','Cogeneration', 'Petcoke', 'Waste', 'Other']
var filter_cats = [];
let country_mode = false;

const anals = ["anal1", "anal2", "anal3"];

let console_tog = 1;

const sourceA_Layer = "Global_Power_Plants-d5dhk4"
const sourceB_Layer = "All_Countries_zoomReadyClip-8ha9gc"
// const sourceB_Layer = "All_Countries_zoomReady-6azvlf"


const radius_styling = [
    // CORRECT ZOOM SYNTAX
    [ 'interpolate', ['linear'], ['zoom'],
        // 2, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 0.155, 5000,2.5], 
        // 4, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 1.55, 5000,25],
        // 6, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 3.1, 5000,50]],
        2, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 0.155, 14000,2.5], 
        4, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 1.55, 14000,55],
        6, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 3.1, 14000,100]],
    [ 'interpolate', ['linear'], ['zoom'],
        2, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 0.155, 33000,2.5], 
        4, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 1.55, 33000,25],
        6, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 3.1, 33000,50]],
    [ 'interpolate', ['linear'], ['zoom'],
        2, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 0.155, 1,2.5], 
        4, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 1.55, 1,25],
        6, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 3.1, 1,50]],
]

const circle_viz = [
    [ 'match', ['get', 'primary_fuel'],
        'Biomass', '#9e5418',
        'Coal', '#fc0303',
        'Gas', '#e01075',
        // 'Gas', '#e04410',
        'Geothermal', '#8800ff',
        'Hydro', '#0398fc',
        'Nuclear', '#ff00f7',
        'Oil', '#eb7f7f',
        'Solar', '#e3bb0e',
        'Tidal', '#1859c9',
        'Wind', '#12c474',
        /* other */ '#a8a8a8'
            ],
    ['case',
        ['has', 'commissioning_year'], 
        ['interpolate', ['linear'], ['get', 'commissioning_year'],
            1950, "#fa00f6",
            1970, '#6200a3',
            2000, '#3b50c4',
            2020, '#2efc1c'
        ],
        "rgba(160,160,160,0.2)" //For no values
    ],
    [ 'match', ['get', 'primary_fuel'],
        'Biomass', '#00de8d',
        'Coal', '#ff005d',
        'Gas', '#ff005d',
        // 'Gas', '#e04410',
        'Geothermal', '#00de8d',
        'Hydro', '#00de8d',
        'Nuclear', '#b31e5c',
        'Oil', '#ff005d',
        'Solar', '#00de8d',
        'Tidal', '#00de8d',
        'Wind', '#00de8d',
        /* other */ '#000000'
    ]
]


map.on('load', () => {

    map.addSource('source-B', {
        'type': 'vector',
        // 'url': "mapbox://ptrszkwcz.1x66qshk",
        'url': "mapbox://ptrszkwcz.d5sf0965",
        'promoteId':'color_code' // Because mapbox fucks up when assigning IDs, make own IDs in QGIS and then set here!!!
    });

    //HIHGLIGHT ON HOVER, POLYGON ---------------------------------------------------------------

    map.addLayer({
        'id': 'B-Countries-fill',
        'type': 'fill',
        'source': 'source-B', 
        'source-layer': sourceB_Layer,
        'layout': {},
        'paint': {
            // 'fill-color': '#12c474', 
            // 'fill-color': '#FFFFFF',
            'fill-color': '#000000',
            'fill-opacity': [ 'case', 
            ['boolean', ['feature-state', 'hoverB'], false], 0.1, 0],
            },
    });

    map.addLayer({
        'id': 'B-Countries-fill-click',
        'type': 'fill',
        'source': 'source-B', 
        'source-layer': sourceB_Layer,
        'layout': {},
        'paint': {
            // 'fill-color': '#12c474', 
            // 'fill-color': '#FFFFFF',
            'fill-color': '#000000',
            'fill-opacity': [ 'case', 
            ['boolean', ['feature-state', 'highl_click_B'], false], 0.1, 0],
            },
    });

    map.addLayer({
        'id': 'B-Countries-line',
        'type': 'line',
        'source': 'source-B', 
        'source-layer': sourceB_Layer,
        'layout': {},
        'paint': {
            'line-width': 0.4,
            'line-color': '#FFFFFF', 
            'line-opacity': [ 'case', 
            ['boolean', ['feature-state', 'highl_click_B'], false], 0.9, 0],
            },
    });

    map.addSource('source-A', {
        'type': 'vector',
        // 'url': "mapbox://ptrszkwcz.clqq16a8mb7jd1up43l248y74-5f80h",
        'url': "mapbox://ptrszkwcz.1h962fw9",
        'promoteId':'gppd_idnr' // Because mapbox fucks up when assigning IDs, make own IDs in QGIS and then set here!!!
    });

    map.addLayer({
        'id': 'A-PrimStyle',
        'type': 'circle',
        'source': 'source-A', 
        'source-layer':sourceA_Layer,
        'layout': {},
        'paint': {
            'circle-radius': radius_styling[0],
            // 'circle-color': , 
            'circle-color': circle_viz[viz_type],
            'circle-opacity': 0.5
            },
    });

    // map.addLayer({
    //     'id': 'A-PrimStyle',
    //     'type': 'circle',
    //     'source': 'source-A', 
    //     'source-layer':sourceA_Layer,
    //     'layout': {},
    //     'paint': {
    //         'circle-radius': radius_styling[0],
    //         // 'circle-color': , 
    //         'circle-color': [ 'match', ['get', 'primary_fuel'],
    //             'Biomass', '#00de8d',
    //             'Coal', '#ff005d',
    //             'Gas', '#ff005d',
    //             // 'Gas', '#e04410',
    //             'Geothermal', '#00de8d',
    //             'Hydro', '#00de8d',
    //             'Nuclear', '#b31456',
    //             'Oil', '#ff005d',
    //             'Solar', '#00de8d',
    //             'Tidal', '#00de8d',
    //             'Wind', '#00de8d',
    //             /* other */ '#000000'
    //         ],
    //         'circle-opacity': 0.5
    //         },
    // });

    // COMMISSIONING YEAR
    // map.addLayer({
    //     'id': 'A-PrimStyle',
    //     'type': 'circle',
    //     'source': 'source-A', 
    //     'source-layer':sourceA_Layer,
    //     'layout': {},
    //     'paint': {
    //         'circle-radius': radius_styling[0],
    //         // 'circle-color': , 
    //         'circle-color': [
    //             'case',
    //             ['has', 'commissioning_year'], 
    //             ['interpolate', ['linear'], ['get', 'commissioning_year'],
    //                 1960, '#6200a3',
    //                 2000, '#3b50c4',
    //                 2020, '#2efc1c'
    //             ],
    //             "rgba(160,160,160,0.2)" //For no values
    //         ],
    //         'circle-opacity': 0.5
    //         },
    // });

 
    //HIHGLIGHT ON HOVER, POINT ---------------------------------------------------------------
    map.addLayer({
        'id': 'A-Hover-point',
        'type': 'circle',
        'source': 'source-A', // reference the data source
        'source-layer':sourceA_Layer,
        'layout': {},
        'paint': {
            'circle-color': "rgba(0,0,0,0)",
            'circle-stroke-color': mystyle.getPropertyValue("--highl_color"),
            'circle-stroke-width': [ 'case', 
                ['boolean', ['feature-state', 'hoverA'], false], 2, 0],
            'circle-radius': radius_styling[0],
            'circle-opacity': [ 'case', 
            ['boolean', ['feature-state', 'hoverA'], false], 1, 0]
        }
    }); 

    // //HIHGLIGHT ON CLICK, POIMT ---------------------------------------------------------------
    // map.addLayer({
    //     'id': 'A-Click-point',
    //     'type': 'circle',
    //     'source': 'source-A', // reference the data source
    //     'source-layer':sourceA_Layer,
    //     'layout': {},
    //     'paint': {
    //         'circle-color': "rgba(0,0,0,0)",
    //         'circle-stroke-color': mystyle.getPropertyValue("--highl_color"),
    //         'circle-stroke-width': [ 'case', 
    //             ['boolean', ['feature-state', 'highl_click'], false], 2, 0],
    //         'circle-radius': radius_styling[0],
    //         'circle-opacity': [ 'case', 
    //         ['boolean', ['feature-state', 'highl_click'], false], 1, 0]
    //     }
    // }); 


    // CLICK ON COUNTRY (B) ---------------------------------------------------------------
    map.on('click', 'B-Countries-fill', (e) => {
        countryName = e.features[0].properties.iso3
        let fullName = e.features[0].properties.name

        if (e.features.length > 0) {
            if (clickedPolygonId !== null) {
                map.setFeatureState(
                    { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
                    { highl_click_B: false}
                );
                // country_mode = false;  
                composite_filter(country_mode = false, filter_cats, countryName)
            }

            clickedPolygonId = e.features[0].id;

            map.setFeatureState(
                { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
                { clic_B: true, highl_click_B: true}
            );

            // country_mode = true; 
            composite_filter(country_mode = true, filter_cats, countryName)

            d3.select("#chart-container").selectAll("svg").remove(); //removes the previous chart
            d3.select("#chart-container").selectAll("div").remove(); //removes chart title

            document.getElementById("graph-popup-id").style.display = "block";
            document.getElementById("graph-coutry-id").innerHTML = `${e.features[0].properties.name}`;

            map.once('idle', () => {
                let fFeatures = map.queryRenderedFeatures({ layers: ['A-PrimStyle']});
                let isocode = fFeatures[0].properties.country

                displayChart(viz_type, fFeatures, isocode)
            });  
        };
        return countryName
    });
    
    // CLICK HIGHLIGHT CLOSE ON CLICK --------------------------------------------------------------- 
    map.on('click', (e) => {
        let counter = 0;
        const quer_features = map.queryRenderedFeatures(e.point);
        for (let i = 0; i < quer_features.length; i++) {
            if (quer_features[i].layer.id === 'B-Countries-fill'){
                counter += 1;
            }
        }
        if (counter == 0) {
            map.setFeatureState(
                    { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
                    { highl_click_B: false}
            );
            country_mode = false;
            composite_filter(country_mode = false, filter_cats, countryName)
            // map.setFilter('A-PrimStyle', null);
            document.getElementById("graph-popup-id").style.display = "none"
        }
    }); 


    // CHANGE MOUSE APPEARANCE --------------------------------------------------------------- 
    map.on('mouseenter', 'B-Countries-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'B-Countries-fill', () => {
        map.getCanvas().style.cursor = 'move';
    });

    
    // HIGHLIGHT ON HOVER BOOLEAN (A PRIM STYLE) --------------------------------------------------------------- 
    const popup = new mapboxgl.Popup({closeButton: false,});

    map.on('mousemove', 'A-PrimStyle', (e) => {
        let feature = e.features[0]
        if (e.features.length > 0) {

            if (hoveredPointId !== null) {
                map.setFeatureState(
                    { source: 'source-A', sourceLayer: sourceA_Layer, id: hoveredPointId },
                    { hoverA: false }
                    );
            }

            hoveredPointId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-A', sourceLayer: sourceA_Layer, id: hoveredPointId },
                { hoverA: true }
            );

            // ADD POP UP
            let plant_cap = numberWithCommas(Math.round(feature.properties.capacity_mw))
            let pow_gen = numberWithCommas(Math.round(feature.properties.estimated_generation_gwh_2017))
            let year_com = feature.properties.commissioning_year

            if (typeof year_com === 'undefined') {
                year_com = "-";
            } else{
                year_com = parseInt(year_com)
            }

            popup.setLngLat(feature.geometry.coordinates)
            .setHTML(`
                    <div class = "pop-title">${feature.properties.name}</div>
                    <div class = "pop-line"></div>

                    <div class = "pop-entry">
                        <div class = "pop-field">Primary Fuel</div>
                        <div class = "pop-value">${feature.properties.primary_fuel}</div>
                    </div>
                    <div class = "pop-entry">
                        <div class = "pop-field">Plant Capacity</div>
                        <div class = "pop-unit">(MW)</div>
                        <div class = "pop-value">${plant_cap}</div>
                    </div>
                    <div class = "pop-entry">
                        <div class = "pop-field">Commissioning Year</div>
                        <div class = "pop-value">${year_com}</div>
                    </div>
                    `)
            .addTo(map);
        }
    });
 
        
    // When the mouse leaves the state-fill layer, update the feature state of the
    map.on('mouseleave', 'A-PrimStyle', () => {
        if (hoveredPointId !== null) {
            map.setFeatureState(
                { source: 'source-A', sourceLayer: sourceA_Layer, id: hoveredPointId },
                { hoverA: false }
            );
            popup.remove();
        }
        hoveredPointId = null;
    });


    // HIGHLIGHT ON HOVER BOOLEAN (B COUNTRIES) --------------------------------------------------------------- 
    map.on('mousemove', 'B-Countries-fill', (e) => {
        if (e.features.length > 0) {

            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'source-B', sourceLayer: sourceB_Layer, id: hoveredPolygonId },
                    { hoverB: false }
                    );
            }

            hoveredPolygonId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-B', sourceLayer: sourceB_Layer, id: hoveredPolygonId },
                { hoverB: true }
            );
        }
    });
        
    // When the mouse leaves the state-fill layer, update the feature state of the
    map.on('mouseleave', 'B-Countries-fill', () => {
        if (hoveredPolygonId !== null) {
            map.setFeatureState(
                { source: 'source-B', sourceLayer: sourceB_Layer, id: hoveredPolygonId },
                { hoverB: false }
            );
        }
        hoveredPolygonId = null;
    });



    // CLICK TO FILTER (INTEGRATED INTO LEGEND) -o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-

    for (let i = 0; i < cats.length; i++) {

        const hash = "#"
        const ID_name = hash.concat(cats[i])

        const sessionDiv = document.querySelector(ID_name);

        // console.log(sessionDiv)

        sessionDiv.addEventListener('click', (e) => {

            let parent_element = sessionDiv.parentElement.parentElement
            let filter_select = e.target.id

            if (filter_cats.includes(filter_select)){
                if (filter_select === "Other") {
                    for (let i = 0; i < other_cats.length; i++) {
                        const del_index = filter_cats.indexOf(other_cats[i]);
                        const new_filter = filter_cats.splice(del_index, 1);
                    }
                } else {
                    const del_index = filter_cats.indexOf(filter_select);
                    const new_filter = filter_cats.splice(del_index, 1);
                }
                sessionDiv.classList.add("active");
                parent_element.classList.add("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.add("active");
            } else{
                if (filter_select === "Other") {
                    for (let i = 0; i < other_cats.length; i++) {
                        const new_filter = filter_cats.push(other_cats[i])
                    }
                } else {
                    const new_filter = filter_cats.push(filter_select)
                }
                
                sessionDiv.checked = false;
                sessionDiv.classList.remove("active");
                parent_element.classList.remove("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.remove("active");
            }

            async function runFunctions() {
                await composite_filter(country_mode, filter_cats, countryName); // Ensures this finishes first
            
                // Wait for the map to be fully loaded before querying features
                await new Promise(resolve => {
                    if (map.isStyleLoaded()) {
                        resolve();
                    } else {
                        map.once('idle', resolve);
                    }
                });
            
                const fFeatures = map.queryRenderedFeatures({
                    layers: ['A-PrimStyle'] 
                });
            
                let fuelData = process_FuelType(fFeatures);
                console.log(fuelData);
            
                if (country_mode) {
                    drawBarChart(fuelData, countryName); 
                }
            }
            
            runFunctions();

        });
    }    
    
});

// SLIDE NAV BAR IN/OUT ---------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("console_butt-id").addEventListener("click", toggleNav);   
});

function toggleNav(){
    if (console_tog === 1){
        document.getElementById("console-id").style.left = "-315px"
        document.getElementById("console_butt-id").style.left = "-5px"
        document.getElementById("console_butt-id").innerHTML = `<img src="./assets/icons/Icon_arrow_in.svg" alt="arrow right" class = "console-butt-arrow">`;
        console_tog = 0
    }
    else {
        document.getElementById("console-id").style.left = "0px";
        document.getElementById("console_butt-id").style.left = "310px"
        document.getElementById("console_butt-id").innerHTML = `<img src="./assets/icons/Icon_arrow_out.svg" alt="arrow left" class = "console-butt-arrow">`;
        console_tog = 1
        // return console_tog
    }
}

// console_tog = toggleNav(console_tog)



// ZOOM TO POLYGON ---------------------------------------------------------------

map.on('click', 'B-Countries-fill', (e) => {
    if (!e.features || e.features.length === 0) return;
    let feature = e.features[0]

    // Fit the map view to the bounds with dynamic padding
    let bounds_ftr = zoom_to_bounds(feature)
    map.fitBounds(bounds_ftr.small_bbox, {
        padding: 100,
        animate: true,  
        duration: 2000,  // Smooth transition time
        linear: false,   // Ease in-out transition
        maxZoom: getZoomLevel(bounds_ftr.ftr_width, bounds_ftr.ftr_height) 
    });

});

function composite_filter(country_mode, filter_cats, countryName){
    // console.log(country_mode, filter_cats, countryName)
    if (filter_cats.length > 0){
        if (country_mode){
            map.setFilter('A-PrimStyle', [
                "all",
                ['match', ['get', 'primary_fuel'], filter_cats,false,true],
                ['==', ['get', 'country'], countryName]
            ]);
        } else{
            map.setFilter('A-PrimStyle',['match', ['get', 'primary_fuel'], filter_cats,false,true])
        }
    }
    else{
        if (country_mode){
            map.setFilter('A-PrimStyle',['==', ['get', 'country'], countryName])
        }else{
            map.setFilter('A-PrimStyle', null)
        }
    }
}


// CLOSE BUTTON, GRAPH POPUP ---------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("graphpopup-close-id").addEventListener("click", () => {
        closeDiv(filter_cats, countryName);
    });
});

function closeDiv(filter_cats, countryName) {
    document.getElementById("graph-popup-id").style.display = "none"

    // map.setFilter('A-PrimStyle', null);
    composite_filter(country_mode=false, filter_cats, countryName)

    map.setFeatureState(
        { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
        { click_B: false, highl_click_B: false}
    );
};

// SET FOG ---------------------------------------------------------------
map.on('style.load', () => {
    map.setFog({
        "range": [5, 8],
        "color": "rgba(150,150,150,0.1)",
        "horizon-blend": 0.05,
        "high-color": "rgba(0,0,0,1)",
        "space-color": "#000000",
        "star-intensity": 0.2
    }); // Set the default atmosphere style
});


// VIZ BUTTON FUNCTIONALITY ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".viz-but");

    buttons.forEach((button, index) => {
        button.addEventListener("click", function () {
            // Remove "active" class from all buttons
            buttons.forEach(btn => btn.classList.remove("active"));

            // Add "active" class to the clicked button
            this.classList.add("active");

            // Log the index of the clicked button (0, 1, or 2)
            // console.log(index);
            map.setPaintProperty('A-PrimStyle', 'circle-color', circle_viz[index]);
            viz_type = index
            map.once('idle', () => {
                let fFeatures = map.queryRenderedFeatures({ layers: ['A-PrimStyle']});
                let isocode = fFeatures[0].properties.country

                displayChart(viz_type, fFeatures, isocode)
                document.querySelectorAll(".legend-container").forEach(div => div.style.display = "none");
                document.getElementById(`legend-${index}`).style.display = "block";
            });  

            
        });
    });
});

function displayChart(viz_type, fFeatures, isocode){
    let country_long = fFeatures[0].properties.country_long
    let country_short = fFeatures[0].properties.country
    if (viz_type === 0){
        let fuelData = process_FuelType(fFeatures)
        chart_FuelType(fuelData)
        chart_CapPerPop(country_short, country_long, fuelData, isocode);
        // drawBarChart(fuelData, countryName);
    } if (viz_type === 1){
        chart_YearBuilt(country_short, country_long, fFeatures)
    } if (viz_type === 2){
        let renewData = process_Renewable(fFeatures)
        chart_Renewable({ continent: country_short, Renewable: renewData.percRenewable , Nuclear: renewData.percNuclear , Nonrenewable: renewData.percNonRenewable}, country_long);
    }
}


// SELECT ALL TOGGLE FUNCTIONALITY ---------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("select-all-toggle").addEventListener("click", selectAll);   
});

function selectAll(){
    const selectAllDiv = document.getElementById("select-all");
    
    const parentDiv = document.getElementById("legend-0");
    const allDescendants = parentDiv.querySelectorAll("*")

    if (selectAllDiv && selectAllDiv.classList.contains("active")) {
        console.log(filter_cats)
        allDescendants.forEach(element => element.classList.remove("active"));
        for (let i = 0; i < cats.length; i++){
            if (!filter_cats.includes(cats[i])){
                filter_cats.push(cats[i])
            }
        }
        for (let i = 0; i < other_cats.length; i++){
            if (!filter_cats.includes(other_cats[i])){
                filter_cats.push(other_cats[i])
            }
        }
        composite_filter(country_mode = false, filter_cats, countryName)
    } else {
        console.log("activating")
        allDescendants.forEach(element => element.classList.add("active"));
        filter_cats = []
        composite_filter(country_mode = false, filter_cats, countryName)
    }

}


