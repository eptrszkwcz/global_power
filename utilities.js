// var cssclass = document.querySelector(":root");
// var mystyle = window.getComputedStyle(cssclass);

export function zoom_to_bounds(feature){
    // console.log(feature)

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