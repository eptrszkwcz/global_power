// This allows for filtering by country and fuel type
export function composite_filter(country_mode, filter_cats, countryName, map){
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


export function zoom_to_bounds(feature){
    console.log(feature)

    let ftr_width = feature.properties.Bounds_width
    let ftr_height = feature.properties.Bounds_height
    let centroid = [feature.properties.Centroids_cent_lon, feature.properties.Centroids_cent_lat]
    let small_bbox = [[centroid[0]-2,centroid[1]-2], [centroid[0]+2,centroid[1]+2]]

    return {
        ftr_width: ftr_width,
        ftr_height: ftr_height,
        small_bbox: small_bbox
    };
}

export function getZoomLevel(width, height) {
    let maxdim = Math.max(width, height)
    let zoom = -0.829 * Math.log(maxdim) + 6.664;
    return Math.min(6, Math.max(3, zoom)); // Clamping between 3 and 6
}

export function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}




















// // SPIN GLOBE ---------------------------------------------------------------

// const secondsPerRevolution = 360;
// // Above zoom level 5, do not rotate.
// const maxSpinZoom = 4;
// // Rotate at intermediate speeds between zoom levels 3 and 5.
// const slowSpinZoom = 3;

// let userInteracting = false;
// let spinEnabled = true;

// function spinGlobe() {
//     const zoom = map.getZoom();
//     if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
//         let distancePerSecond = 360 / secondsPerRevolution;
//         if (zoom > slowSpinZoom) {
//             // Slow spinning at higher zooms
//             const zoomDif =
//                 (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
//             distancePerSecond *= zoomDif;
//         }
//         const center = map.getCenter();
//         center.lng -= distancePerSecond;
//         // Smoothly animate the map over one second.
//         // When this animation is complete, it calls a 'moveend' event.
//         map.easeTo({ center, duration: 1000, easing: (n) => n });
//     }
// }

//    // Pause spinning on interaction
// // map.on('mousedown', () => {userInteracting = true;});

// // // Restart spinning the globe when interaction is complete
// // map.on('mouseup', () => {
// //     userInteracting = false;delaySpinGlobe();});

// // // These events account for cases where the mouse has moved
// // // off the map, so 'mouseup' will not be fired.
// // map.on('dragend', () => {userInteracting = false;delaySpinGlobe();});
// // map.on('pitchend', () => {userInteracting = false;delaySpinGlobe();});
// // map.on('rotateend', () => {userInteracting = false;delaySpinGlobe();});

// // // When animation is complete, start spinning if there is no ongoing interaction
// // map.on('moveend', () => {delaySpinGlobe();});

// // document.getElementById('btn-spin').addEventListener('click', (e) => {
// //     spinEnabled = !spinEnabled;
// //     if (spinEnabled) {
// //         spinGlobe();
// //         e.target.innerHTML = 'Pause rotation';
// //     } else {
// //         map.stop(); // Immediately end ongoing animation
// //         e.target.innerHTML = 'Start rotation';
// //     }
// // });

// function delaySpinGlobe() {
//     setTimeout(spinGlobe, 15000); //wait 15 seonds before spin 
// }

// // Call the function to start the delay
// delaySpinGlobe();


// // INSTRUCTION POPUP -ANALYSIS BUTTON ---------------------------------------------------------------

// const elementToHover = document.getElementById('dropdown-butt');
// const elementToPopup = document.getElementById('instruct-anal');
// const triangToPopup = document.getElementById('popup tip');

// elementToHover.addEventListener('mouseenter',(e) => {

//     var rect = elementToHover.getBoundingClientRect();

//     let posX = (rect.right+rect.left)/2
//     let posY = rect.bottom 

//     var m_pos_x,m_pos_y;

//     window.onmousemove = function(e) { m_pos_x = e.pageX; m_pos_y = e.pageY; }

//     setTimeout(function() { 
//         m_pos_x
//         m_pos_y
//         if (m_pos_x > rect.left && m_pos_x < rect.right && m_pos_y > rect.top && m_pos_y < rect.bottom) {
//             elementToPopup.style.display = 'block';
//             elementToPopup.style.left = `${posX}px`;
//             elementToPopup.style.top = `${posY}px`;

//             triangToPopup.style.display = 'block';
//             triangToPopup.style.left = `${posX}px`;
//             triangToPopup.style.top = `${posY-12}px`;
//             }
//         else {}; 
//     },2000);

// });


// elementToHover.addEventListener('mouseleave',(f) => {
//     elementToPopup.style.display = 'none';
//     triangToPopup.style.display = 'none';
// });


// // INSTRUCTION POPUP - LAYER TOGGLES ---------------------------------------------------------------

// const elementToHover2 = document.getElementById('toggle group');
// const elementToPopup2 = document.getElementById('instruct-tog');

// elementToHover2.addEventListener('mouseenter',(e) => {

//     var rect = elementToHover2.getBoundingClientRect();

//     let posX = (rect.right+rect.left)/2
//     let posY = rect.bottom + 25

//     var m_pos_x,m_pos_y;

//     window.onmousemove = function(e) { m_pos_x = e.pageX; m_pos_y = e.pageY; }

//     setTimeout(function() { 
//         m_pos_x
//         m_pos_y
//         if (m_pos_x > rect.left && m_pos_x < rect.right && m_pos_y > rect.top && m_pos_y < rect.bottom) {
//             elementToPopup2.style.display = 'block';
//             elementToPopup2.style.left = `${posX}px`;
//             elementToPopup2.style.top = `${posY}px`;

//             triangToPopup.style.display = 'block';
//             triangToPopup.style.left = `${posX}px`;
//             triangToPopup.style.top = `${posY-12}px`;
//             }
//         else {}; 
//     },2000);

// });

// elementToHover2.addEventListener('mouseleave',(f) => {
//     elementToPopup2.style.display = 'none';
//     triangToPopup.style.display = 'none';
// });