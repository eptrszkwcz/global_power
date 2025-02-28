// Allow for variables in the css 
var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

const filterGroup = document.getElementById('filter-group');

mapboxgl.accessToken = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNscGkxOHVvbjA2eW8ybG80NDJ3ajBtMWwifQ.L2qe-aJO35nls3sfd0WKPA';
let at = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNscGkxOHVvbjA2eW8ybG80NDJ3ajBtMWwifQ.L2qe-aJO35nls3sfd0WKPA';
 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    // style: 'mapbox://styles/mapbox/streets-v12', // style URL
    style: 'mapbox://styles/ptrszkwcz/clqmt03br00g201qrfnt9442u',
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


const cats = ['Biomass','Coal','Gas','Geothermal','Hydro','Nuclear','Oil','Solar','Tidal','Wind'];
const cat_labels = ['Biomass','Coal','Gas','Geothermal','Hydro','Nuclear','Oil','Solar','Wave & Tidal','Wind'];;
var filter_cats = [];

const anals = ["anal1", "anal2", "anal3"];

let console_tog = 1;

const sourceA_Layer = "Global_Power_Plants-d5dhk4"
const sourceB_Layer = "All_Countries-6jqzer"


// NO scaling with zoom level
// const radius_styling = [
//     [ 'interpolate', ['linear'], ['get', 'capacity_m'],
//         0, 1.55,
//         5000,25],
//     [ 'interpolate', ['linear'], ['get', 'estimate_4'],
//         0, 1.55,
//         33000,25],
//     [ 'interpolate', ['linear'], ['get', 'CapFac'],
//         0.5, 1.55,
//         1,25]
// ]

// SCALING with zoom level woot woot!
const radius_styling = [
    // CORRECT ZOOM SYNTAX
    [ 'interpolate', ['linear'], ['zoom'],
        2, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 0.155, 5000,2.5], 
        4, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 1.55, 5000,25],
        6, [ 'interpolate', ['linear'], ['get', 'capacity_mw'], 0, 3.1, 5000,50]],
    [ 'interpolate', ['linear'], ['zoom'],
        2, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 0.155, 33000,2.5], 
        4, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 1.55, 33000,25],
        6, [ 'interpolate', ['linear'], ['get', 'estimated_generation_gwh_2017'], 0, 3.1, 33000,50]],
    [ 'interpolate', ['linear'], ['zoom'],
        2, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 0.155, 1,2.5], 
        4, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 1.55, 1,25],
        6, [ 'interpolate', ['linear'], ['get', ('estimated_generation_gwh_2017'/'capacity_mw')], 0.5, 3.1, 1,50]],
]

// let 'A-PrimStyle' = "anal1"

map.on('load', () => {

    map.addSource('source-B', {
        'type': 'vector',
        // 'url': "mapbox://ptrszkwcz.clqq16a8mb7jd1up43l248y74-5f80h",
        'url': "mapbox://ptrszkwcz.c1dnkwtp",
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
            'fill-color': '#FFFFFF',
            'fill-opacity': [ 'case', 
            ['boolean', ['feature-state', 'hoverB'], false], 0.05, 0],
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
            'fill-color': '#FFFFFF',
            'fill-opacity': [ 'case', 
            ['boolean', ['feature-state', 'highl_click_B'], false], 0.05, 0],
            },
    });

    map.addLayer({
        'id': 'B-Countries-line',
        'type': 'line',
        'source': 'source-B', 
        'source-layer': sourceB_Layer,
        'layout': {},
        'paint': {
            'line-width': 0.2,
            'line-color': '#FFFFFF', 
            'line-opacity': [ 'case', 
            ['boolean', ['feature-state', 'highl_click_B'], false], 0.8, 0],
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
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'dim_noselect'], false], 'rgba(70,70,70,0.6)', // Gray color when 'select' is true
                ['match', ['get', 'primary_fuel'],
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
                    /* other */ '#000000'
                ]
            ],
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
    //             'Biomass', '#9e5418',
    //             'Coal', '#fc0303',
    //             'Gas', '#e01075',
    //             // 'Gas', '#e04410',
    //             'Geothermal', '#8800ff',
    //             'Hydro', '#0398fc',
    //             'Nuclear', '#ff00f7',
    //             'Oil', '#eb7f7f',
    //             'Solar', '#e3bb0e',
    //             'Tidal', '#1859c9',
    //             'Wind', '#12c474',
    //             /* other */ '#000000'
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


    //HIHGLIGHT ON CLICK, POIMT ---------------------------------------------------------------
    map.addLayer({
        'id': 'A-Click-point',
        'type': 'circle',
        'source': 'source-A', // reference the data source
        'source-layer':sourceA_Layer,
        'layout': {},
        'paint': {
            'circle-color': "rgba(0,0,0,0)",
            'circle-stroke-color': mystyle.getPropertyValue("--highl_color"),
            'circle-stroke-width': [ 'case', 
                ['boolean', ['feature-state', 'highl_click'], false], 2, 0],
            'circle-radius': radius_styling[0],
            'circle-opacity': [ 'case', 
            ['boolean', ['feature-state', 'highl_click'], false], 1, 0]
        }
    }); 

     // POP-UP ON HOVER ---------------------------------------------------------------

    const popup = new mapboxgl.Popup({
        closeButton: false,
    });

    map.on('mouseenter', 'A-PrimStyle', (e) => {
        // new mapboxgl.Popup()
        feature = e.features[0]
        // console.log(feature.geometry.coordinates[0])

        // clean popup numbers 
        let plant_cap = numberWithCommas(Math.round(feature.properties.capacity_mw))
        let pow_gen = numberWithCommas(Math.round(feature.properties.estimated_generation_gwh_2017))
        let cap_fac = Math.round(feature.properties.CapFac*100)

        popup.setLngLat(feature.geometry.coordinates)
        // popup.setLngLat(getFeatureCenter(feature))
        // popup.setLngLat(e.lngLat)
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
                    <div class = "pop-field">Power Generation</div>
                    <div class = "pop-unit">(GW)</div>
                    <div class = "pop-value">${pow_gen}</div>
                </div>
                  `)
        .addTo(map);
    });

    map.on('mouseleave', 'A-PrimStyle', () => {
        popup.remove();
    });
    

    // // POPUP ON CLICK ---------------------------------------------------------------
    // const popup = new mapboxgl.Popup({
    //     closeButton: false,
    // });

    // // this function finds the center of a feature (to set popup) 
    // function getFeatureCenter(feature) {
    //     let center = [];
    //     let latitude = 0;
    //     let longitude = 0;
    //     let height = 0;
    //     let coordinates = [];
    //     feature.geometry.coordinates.forEach(function (c) {
    //         let dupe = [];
    //         if (feature.geometry.type === "MultiPolygon")
    //             dupe.push(...c[0]); //deep clone to avoid modifying the original array
    //         else 
    //             dupe.push(...c); //deep clone to avoid modifying the original array
    //         dupe.splice(-1, 1); //features in mapbox repeat the first coordinates at the end. We remove it.
    //         coordinates = coordinates.concat(dupe);
    //     });
    //     if (feature.geometry.type === "Point") {
    //         center = coordinates[0];
    //     }
    //     else {
    //         coordinates.forEach(function (c) {
    //             latitude += c[0];
    //             longitude += c[1];
    //         });
    //         center = [latitude / coordinates.length, longitude / coordinates.length];
    //     }

    //     return center;
    // }

    // this function adds a common to numbers  
    function numberWithCommas(x) {
        x = x.toString();
        var pattern = /(-?\d+)(\d{3})/;
        while (pattern.test(x))
            x = x.replace(pattern, "$1,$2");
        return x;
    }

    // map.on('click', 'A-PrimStyle', (e) => {
    //     new mapboxgl.Popup()
    //     feature = e.features[0]
    //     // console.log(feature.geometry.coordinates[0])

    //     // clean popup numbers 
    //     let plant_cap = numberWithCommas(Math.round(feature.properties.capacity_mw))
    //     let pow_gen = numberWithCommas(Math.round(feature.properties.estimated_generation_gwh_2017))
    //     let cap_fac = Math.round(feature.properties.CapFac*100)

    //     popup.setLngLat(feature.geometry.coordinates)
    //     // popup.setLngLat(getFeatureCenter(feature))
    //     // popup.setLngLat(e.lngLat)
    //     .setHTML(`
    //             <div class = "pop-title">${feature.properties.name}</div>
    //             <div class = "pop-line"></div>

    //             <div class = "pop-entry">
    //                 <div class = "pop-field">Primary Fuel</div>
    //                 <div class = "pop-value">${feature.properties.primary_fuel}</div>
    //             </div>
    //             <div class = "pop-entry">
    //                 <div class = "pop-field">Plant Capacity</div>
    //                 <div class = "pop-unit">(MW)</div>
    //                 <div class = "pop-value">${plant_cap}</div>
    //             </div>
    //             <div class = "pop-entry">
    //                 <div class = "pop-field">Power Generation</div>
    //                 <div class = "pop-unit">(GW)</div>
    //                 <div class = "pop-value">${pow_gen}</div>
    //             </div>
    //             <div class = "pop-entry">
    //                 <div class = "pop-field">Capacity Factor</div>
    //                 <div class = "pop-unit">%</div>
    //                 <div class = "pop-value">${cap_fac}</div>
    //             </div>
    //               `)
    //     .addTo(map);
    // });
    
    // HIGHLIGHT ON CLICK BOOLEAN  (A) ---------------------------------------------------------------
    map.on('click', 'A-PrimStyle', (e) => {
        if (e.features.length > 0) {
            if (clickedPointId !== null) {
                map.setFeatureState(
                    { source: 'source-A', sourceLayer: sourceA_Layer, id: clickedPointId },
                    { click: false, highl_click: false }
                    );
            }

            clickedPointId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-A', sourceLayer: sourceA_Layer, id: clickedPointId },
                { click: true, highl_click: true }
            );
        } 
    });
 
    // CLICK HIGHLIGHT CLOSE ON CLICK --------------------------------------------------------------- 
    map.on('click', (e) => {
        let counter = 0;
        const quer_features = map.queryRenderedFeatures(e.point);
        for (let i = 0; i < quer_features.length; i++) {
            if (quer_features[i].layer.id === 'A-PrimStyle'){
                counter += 1;
            }
        }

        if (counter == 0) {
            map.setFeatureState(
                    { source: 'source-A', sourceLayer: sourceA_Layer, id: clickedPointId },
                    { highl_click: false }
                );
        }
    }); 

    // HIGHLIGHT ON CLICK BOOLEAN  (B) ---------------------------------------------------------------
    map.on('click', 'B-Countries-fill', (e) => {
        const filteredFeatures = map.querySourceFeatures('source-A', {
            sourceLayer: sourceA_Layer // Only needed for vector sources
        });
        console.log(filteredFeatures.length)
        let countryName = e.features[0].properties.iso3

        if (e.features.length > 0) {
            if (clickedPolygonId !== null) {
                map.setFeatureState(
                    { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
                    { highl_click_B: false}
                );  
                
                // Loop through and apply state to matching features
                filteredFeatures.forEach(feature => {
                        map.setFeatureState(
                            { source: 'source-A', sourceLayer: sourceA_Layer, id: feature.id },
                            { dim_noselect: false }
                        );
                });
                // map.setFeatureState(
                //         { source: 'source-A', sourceLayer: sourceA_Layer, id: clickedPointId },
                //         { dim_noselect: false }
                // );
            }

            clickedPolygonId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
                { clic_B: true, highl_click_B: true}
            );
            filteredFeatures.forEach(feature => {
                if (feature.properties.country != countryName) {
                    map.setFeatureState(
                        { source: 'source-A', sourceLayer: sourceA_Layer, id: feature.id },
                        { dim_noselect: true }
                    );
                }
            });
        };
    });
    
    // CLICK HIGHLIGHT CLOSE ON CLICK --------------------------------------------------------------- 
    map.on('click', (e) => {
        const filteredFeatures = map.querySourceFeatures('source-A', {
            sourceLayer: sourceA_Layer // Only needed for vector sources
        });
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
            filteredFeatures.forEach(feature => {
                map.setFeatureState(
                    { source: 'source-A', sourceLayer: sourceA_Layer, id: feature.id },
                    { dim_noselect: false }
                );
            });
            document.getElementById("graph-popup-id").style.display = "none"
        }
    }); 


    // CHANGE MOUSE APPEARANCE --------------------------------------------------------------- 
    map.on('mouseenter', 'A-PrimStyle', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'A-PrimStyle', () => {
        map.getCanvas().style.cursor = 'move';
    });

  
    
    // HIGHLIGHT ON HOVER BOOLEAN (A PRIM STYLE) --------------------------------------------------------------- 
    map.on('mousemove', 'A-PrimStyle', (e) => {
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
        }
    });
 
        
    // When the mouse leaves the state-fill layer, update the feature state of the
    map.on('mouseleave', 'A-PrimStyle', () => {
        if (hoveredPointId !== null) {
            map.setFeatureState(
                { source: 'source-A', sourceLayer: sourceA_Layer, id: hoveredPointId },
                { hoverA: false }
            );
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



    // CLICK TO FILTER (INTEGRATED INTO LEGEND) ---------------------------------------------------------------

    for (let i = 0; i < cats.length; i++) {

        const hash = "#"
        const ID_name = hash.concat(cats[i])


        const sessionDiv = document.querySelector(ID_name);

        // console.log(sessionDiv)

        sessionDiv.addEventListener('click', (e) => {

            let parent_element = sessionDiv.parentElement.parentElement
            filter_select = e.target.id

            if (filter_cats.includes(filter_select)){
                const del_index = filter_cats.indexOf(filter_select);
                const new_filter = filter_cats.splice(del_index, 1);
                sessionDiv.classList.add("active");
                parent_element.classList.add("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.add("active");
            }
            else{
                const new_filter = filter_cats.push(filter_select)
                sessionDiv.checked = false;
                sessionDiv.classList.remove("active");
                parent_element.classList.remove("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.remove("active");
            }

            if (filter_cats.length > 0){
                map.setFilter('A-PrimStyle', ['match', ['get', 'primary_fuel'], filter_cats,false,true]);
            }
            else{
                map.setFilter('A-PrimStyle', null)
            }
        });
    }

    // CLICK TO CHANGE ANALYSIS ---------------------------------------------------------------

    const dropDownButton = document.querySelector('#dropdown-butt');

    for (let i = 0; i < anals.length; i++) {

        const hash = "#"
        const ID_name = hash.concat(anals[i])

        const sessionDiv = document.querySelector(ID_name);

        sessionDiv.onclick = function (e) {
            // const clickedLayer = this.textContent;
            const clickedLayer = sessionDiv.id

            e.preventDefault();
            e.stopPropagation();

            for (let i = 0; i < anals.length; i++){
                const hash = "#"
                const ID_name = hash.concat(anals[i])

                if (anals[i] != clickedLayer){
                    // console.log(i)
                    // map.setLayoutProperty(anals[i], 'visibility', 'none');

                    let noclickDiv = document.querySelector(ID_name);
                    const noclickclass = noclickDiv.classList;
                    noclickclass.remove("checked")

                    document.getElementById("entry-".concat(i)).classList.remove("active");

                }
                else {
                    // map.setLayoutProperty(anals[i], 'visibility', 'visible');
                    // 'A-PrimStyle' = anals[i]
                    
                    // console.log(dropDownButton.textContent)
                    dropDownButton.textContent = e.target.text
                    map.setPaintProperty('A-PrimStyle', 'circle-radius', radius_styling[i]);
                    map.setPaintProperty('A-Hover-point', 'circle-radius', radius_styling[i]);
                    map.setPaintProperty('A-Click-point', 'circle-radius', radius_styling[i]);

                    document.getElementById("entry-".concat(i)).classList.add("active");
                    // document.getElementById("entry-".concat(2)).classList.toggle("active");
                    // document.getElementById("entry-".concat(intlist[i+1])).classList.remove("active");
                
                    const clickclass = sessionDiv.classList;
                    let clickDiv = document.querySelector(ID_name);
                    const noclickclass = clickDiv.classList;
                    clickclass.add("checked")
                }
            }
        }
    }

    // INSTRUCTION POPUP -ANALYSIS BUTTON ---------------------------------------------------------------

    const elementToHover = document.getElementById('dropdown-butt');
    const elementToPopup = document.getElementById('instruct-anal');
    const triangToPopup = document.getElementById('popup tip');

    elementToHover.addEventListener('mouseenter',(e) => {

        var rect = elementToHover.getBoundingClientRect();

        let posX = (rect.right+rect.left)/2
        let posY = rect.bottom 

        var m_pos_x,m_pos_y;
   
        window.onmousemove = function(e) { m_pos_x = e.pageX; m_pos_y = e.pageY; }

        setTimeout(function() { 
            m_pos_x
            m_pos_y
            if (m_pos_x > rect.left && m_pos_x < rect.right && m_pos_y > rect.top && m_pos_y < rect.bottom) {
                elementToPopup.style.display = 'block';
                elementToPopup.style.left = `${posX}px`;
                elementToPopup.style.top = `${posY}px`;

                triangToPopup.style.display = 'block';
                triangToPopup.style.left = `${posX}px`;
                triangToPopup.style.top = `${posY-12}px`;
                }
            else {}; 
        },2000);

    });


    elementToHover.addEventListener('mouseleave',(f) => {
        elementToPopup.style.display = 'none';
        triangToPopup.style.display = 'none';
    });


    // INSTRUCTION POPUP - LAYER TOGGLES ---------------------------------------------------------------

    const elementToHover2 = document.getElementById('toggle group');
    const elementToPopup2 = document.getElementById('instruct-tog');

    elementToHover2.addEventListener('mouseenter',(e) => {

        var rect = elementToHover2.getBoundingClientRect();

        let posX = (rect.right+rect.left)/2
        let posY = rect.bottom + 25

        var m_pos_x,m_pos_y;
   
        window.onmousemove = function(e) { m_pos_x = e.pageX; m_pos_y = e.pageY; }

        setTimeout(function() { 
            m_pos_x
            m_pos_y
            if (m_pos_x > rect.left && m_pos_x < rect.right && m_pos_y > rect.top && m_pos_y < rect.bottom) {
                elementToPopup2.style.display = 'block';
                elementToPopup2.style.left = `${posX}px`;
                elementToPopup2.style.top = `${posY}px`;

                triangToPopup.style.display = 'block';
                triangToPopup.style.left = `${posX}px`;
                triangToPopup.style.top = `${posY-12}px`;
                }
            else {}; 
        },2000);

    });

    elementToHover2.addEventListener('mouseleave',(f) => {
        elementToPopup2.style.display = 'none';
        triangToPopup.style.display = 'none';
    });
    
});

// Nav bar hide-show

function toggleNav(){
    if (console_tog === 1){
        document.getElementById("console-id").style.left = "-315px"
        document.getElementById("console_butt-id").style.left = "-5px"
        document.getElementById("console_butt-id").style.paddingTop = "8px";
        document.getElementById("console_butt-id").style.paddingBottom = "0px";
        document.getElementById("console_butt-id").innerHTML = `&#9654`;
        console_tog = 0
    }
    else {
        document.getElementById("console-id").style.left = "0px";
        document.getElementById("console_butt-id").style.left = "310px"
        document.getElementById("console_butt-id").innerHTML = `&#9664`;
        document.getElementById("console_butt-id").style.paddingTop = "4px";
        document.getElementById("console_butt-id").style.paddingBottom = "3px";
        console_tog = 1
    }
}
    
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


// INSTRUCTION POPUP - LAYER TOGGLES ---------------------------------------------------------------

const secondsPerRevolution = 360;
// Above zoom level 5, do not rotate.
const maxSpinZoom = 4;
// Rotate at intermediate speeds between zoom levels 3 and 5.
const slowSpinZoom = 3;

let userInteracting = false;
let spinEnabled = true;

function spinGlobe() {
    const zoom = map.getZoom();
    if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
            // Slow spinning at higher zooms
            const zoomDif =
                (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        // Smoothly animate the map over one second.
        // When this animation is complete, it calls a 'moveend' event.
        map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
}


// SPIN GLOBE ---------------------------------------------------------------

   // Pause spinning on interaction
   map.on('mousedown', () => {
    userInteracting = true;
});

// Restart spinning the globe when interaction is complete
map.on('mouseup', () => {
    userInteracting = false;
    delaySpinGlobe();
});

// These events account for cases where the mouse has moved
// off the map, so 'mouseup' will not be fired.
map.on('dragend', () => {
    userInteracting = false;
    delaySpinGlobe();
});
map.on('pitchend', () => {
    userInteracting = false;
    delaySpinGlobe();
});
map.on('rotateend', () => {
    userInteracting = false;
    delaySpinGlobe();
});

// When animation is complete, start spinning if there is no ongoing interaction
map.on('moveend', () => {
    delaySpinGlobe();
});

// document.getElementById('btn-spin').addEventListener('click', (e) => {
//     spinEnabled = !spinEnabled;
//     if (spinEnabled) {
//         spinGlobe();
//         e.target.innerHTML = 'Pause rotation';
//     } else {
//         map.stop(); // Immediately end ongoing animation
//         e.target.innerHTML = 'Start rotation';
//     }
// });

function delaySpinGlobe() {
    // setTimeout(spinGlobe, 15000); //wait 15 seonds before spin 
}

// Call the function to start the delay
delaySpinGlobe();


// Zoom to clicked polygon ---------------------------------------------------------------


// var coordinates = f.geometry.coordinates[0];
// var bounds = coordinates.reduce(function (bounds, coord) {
//     return bounds.extend(coord);
// }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

// map.fitBounds(bounds, {
//     padding: 20
// });



map.on('click', 'B-Countries-fill', (e) => {
    if (!e.features || e.features.length === 0) return;

    // Always get the full geometry from the first feature
    const feature = e.features[0]; 
    let coordinates = [];

    if (feature.geometry.type === 'Point') {
        coordinates = [feature.geometry.coordinates];
    } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiPoint') {
        coordinates = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
        coordinates = feature.geometry.coordinates.flat();
    } else if (feature.geometry.type === 'MultiPolygon') {
        coordinates = feature.geometry.coordinates.flat(2); // Flatten deeply for MultiPolygons
    }

    if (coordinates.length === 0) return;

    const lats = coordinates.map(coord => coord[1]);
    const lngs = coordinates.map(coord => coord[0]);

    const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)], // Southwest corner
        [Math.max(...lngs), Math.max(...lats)]  // Northeast corner
    );

    console.log(coordinates.length)
    console.log('Bounds:', bounds);

    // Dynamically adjust padding based on feature size
    const width = Math.abs(bounds.getEast() - bounds.getWest());
    const height = Math.abs(bounds.getNorth() - bounds.getSouth());

    // Dynamically adjust padding based on the country size
    // const width = bounds[1][0]-bounds[0][0];
    // const height = bounds[1][1]-bounds[0][1];

    // console.log(width,height)

    let dynamicPadding = Math.max(100, Math.min(width, height) * 100); // Adjust padding based on size
    dynamicPadding = Math.min(dynamicPadding, 700); // Cap padding to avoid excessive space

    // Fit the map view to the bounds with dynamic padding
    map.fitBounds(bounds, {
        padding: dynamicPadding,
        animate: true,  
        duration: 4000,  // Smooth transition time
        linear: false,   // Ease in-out transition
        maxZoom: 3.3      // Prevent over-zooming in large countries
    });

    // return bounds;
});


function drawBarChart(fuelData, countryName) {
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
    const defaultFuelData = fuelCategories.reduce((acc, fuelType) => {
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
    const data = fuelCategories.map(fuelType => ({
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
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    d3.select("#chart-container").select("svg").remove();

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
    
    // svg.append("g")
    //     .call(d3.axisBottom(xScale).tickSize(0))

    const textElements = svg.selectAll("text");
    const pathAndLineElements = svg.selectAll("path, line");

    textElements.style("fill", mystyle.getPropertyValue("--sec_color"));   // Change text color
    pathAndLineElements.style("stroke", mystyle.getPropertyValue("--ter_color"));  // Change line/path color

}

map.on('click', 'B-Countries-fill', (e) => {
    // console.log(e.features[0].properties)
    let countryName = e.features[0].properties.iso3
    const powerplantFeatures = map.queryRenderedFeatures({ layers: ['A-PrimStyle'] });
    const filteredPowerplants = powerplantFeatures.filter(feature => feature.properties.country === countryName);

    const fuelData = filteredPowerplants.reduce((acc, feature) => {
        const fuelType = feature.properties.primary_fuel;
        const capacity = parseInt(feature.properties.capacity_mw) || 0; // Ensure it's a number

        if (!acc[fuelType]) {
            acc[fuelType] = { count: 0, totalCapacity: 0 };
        }

        acc[fuelType].count += 1; // Increment count
        acc[fuelType].totalCapacity += capacity; // Sum capacity

        return acc;
    }, {});

    // Log the results
    console.log(`Fuel type breakdown in ${countryName}:`, fuelData);

    document.getElementById("graph-popup-id").style.display = "block"
    document.getElementById("graph-coutry-id").innerHTML = `${e.features[0].properties.name}`;
    drawBarChart(fuelData, countryName);
});



function closeDiv() {
    document.getElementById("graph-popup-id").style.display = "none"

    const filteredFeatures = map.querySourceFeatures('source-A', {
        sourceLayer: sourceA_Layer // Only needed for vector sources
    });

    filteredFeatures.forEach(feature => {
        map.setFeatureState(
            { source: 'source-A', sourceLayer: sourceA_Layer, id: feature.id },
            { dim_noselect: false }
        );
    });

    map.setFeatureState(
        { source: 'source-B', sourceLayer: sourceB_Layer, id: clickedPolygonId },
        { click_B: false, highl_click_B: false}
    );
};


map.on('click', (event) => {
    const coordinates = event.lngLat; // Get the clicked coordinates
    console.log(`Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}`);

});