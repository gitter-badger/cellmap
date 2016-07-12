// Build the grid

const grid = $('.grid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

const modal = function(protein){
    var html = '<div class="ui modal">';
    // '<i class="close icon"></i>';
    html += '<div class="header">' + protein.uniprotId + '</div>';
    html += '<div class="content">';
    html += '<p><strong>Primary gene:</strong> ' + protein.geneName + '</p>';
    if(protein.proteinName){
        html += '<p><strong>Protein name:</strong> ' + protein.proteinName + '</p>';
    }
    if(protein.localizations && protein.localizations.localizations && protein.localizations.localizations.length > 0){
        html += '<p><strong>Localizations:</strong> ' + protein.localizations.localizations.map(function(element){return element + " "}) + '</p>';
    }
    if(protein.interactions && protein.interactions.partners && protein.interactions.partners.length > 0){
        html += '<p><strong>Interaction partners:</strong> ' + protein.interactions.partners.map(function(element){return element.interactor + " "}) + '</p>';
    }
    html += '</div>';
    html += '<div class="actions"><a href="/protein/' + protein.uniprotId + '" class="ui approve button">Go to protein page</a></div>';
    html += '</div>';
    $(html).modal('show');
}

grid.on( 'click', '.grid-item', function() {
    modal($(this).data('protein'));
});

(function(){
    var items = [];

    partners.forEach(function(protein){
        var html = '<div class="grid-item" style="border-color:' + localizations[protein.localizations.localizations[0]].color + '"><p>' + protein.uniprotId + '</p><div class="cubescontainer">';

        if(protein.localizations && protein.localizations.localizations && protein.localizations.localizations.length > 0){
            protein.localizations.localizations.forEach(function(localization){
                html += '<div class="cube" style="background-color:' + localizations[localization].color + ';"></div>'
            });
        }

        html += '</div>';

        if(protein.interactions && protein.interactions.partners && protein.interactions.partners.length > 0){
            html += '<div class="interactionCount">' + protein.interactions.partners.length + '</div>'
        }

        html += '</div>';

        var element = $(html);
        element.data("protein", protein);
        items.push(element[0]);
    });

    grid.isotope('insert', items);
})();

var locMap;
var interMap;
var featuresGeoJSON;


//Interactions helpers

var randomPointInPoly = function(polygon, vs) {
    var bounds = polygon.getBounds(); 
    var x_min  = bounds.getEast();
    var x_max  = bounds.getWest();
    var y_min  = bounds.getSouth();
    var y_max  = bounds.getNorth();

    var x = y_min + (Math.random() * (y_max - y_min));
    var y = x_min + (Math.random() * (x_max - x_min));

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    if (inside) {
        return [y, x];
    } else {
        return randomPointInPoly(polygon, vs);
    }
};

var addToInteractionMap = function(protein, color){
    var geoLoc = undefined;
    for(var i=0; i < protein.localizations.localizations.length && geoLoc === undefined; i++){
        geoLoc = featuresGeoJSON.find(function(geoLoc){
            return geoLoc.properties.localization == protein.localizations.localizations[i];
        });
    }

    if(geoLoc === undefined){
        // Do nothing!
    } else {
        try {

            var x = 0;
            var y = 0;

            switch(geoLoc.geometry.type){
                case "Polygon":
                    var coords = randomPointInPoly(L.polygon(geoLoc.geometry.coordinates), geoLoc.geometry.coordinates[0]);
                    x = coords[1];
                    y = coords[0];
                    break;
                case "Point":
                    // http://stackoverflow.com/questions/481144/equation-for-testing-if-a-point-is-inside-a-circle
                    var center = geoLoc.geometry.coordinates;
                    var radius = geoLoc.properties.radius;
                    var x_max = center[0]+radius;
                    var x_min = center[0]-radius;

                    var y_max = center[1]+radius;
                    var y_min = center[1]-radius;

                    x = x_min + (Math.random() * (x_max - x_min));
                    y = y_min + (Math.random() * (y_max - y_min));

                    x = x_max;
                    y = y_max;

                    while(Math.pow(x - center[0],2) + Math.pow(y - center[1], 2) > Math.pow(radius, 2)){
                        x = x_min + (Math.random() * (x_max - x_min));
                        y = y_min + (Math.random() * (y_max - y_min));
                    }
                    break;
                case "LineString":
                    var position = Math.floor(Math.random() * geoLoc.geometry.coordinates.length);
                    var a = geoLoc.geometry.coordinates[position];
                    var b = geoLoc.geometry.coordinates[position+1];
                    var reg = regression('linear',[a,b]);

                    var x_max = a[0];
                    var x_min = b[0];

                    if(x_max < b[0]) {
                        x_max = b[0];
                        x_min = a[0];
                    }

                    x = x_min + (Math.random() * (x_max - x_min));

                    y = reg.equation[0]*x + reg.equation[1];

                    break;
            }


            return L.circleMarker([y,x],{
                radius: 6,
                fillColor: color || "gray",
                color: color || "gray",
                opacity: 1,
                fillOpacity: 1,
            });

        } catch (e) {
            // Need to make something smarter here: case point calculation exceeedes heap. Very likely with Polygons!
            console.log(e);
            console.log("Will reload");
            window.location.reload();
        }
    }
};

// Build maps
(function(imageId) {
    renderProgress();
    imageId = "573c87c182a9e1ae1e37d08e";
    // Wait till I have the localizations
    $.ajax({
        url: '/features/' + imageId,
        type: 'GET',
        success: function(results) {
            featuresGeoJSON = results;

            var img = new Image();
            img.src = '/maps/' + imageId;

            // Wait untill I have the image
            img.onload = function() {
                var width = this.width;
                var height = this.height;

                while(width > 500 || height > 500){
                    width /= 2;
                    height /= 2;
                }

                var imageBounds = [[0, width], [height, 0]];

                // LOCALIZATIONS MAP
                locMap = L.map('locMap', {
                    maxZoom: 4,
                    minZoom: 0,
                    maxBounds: [[-100, width+100], [height+100, -100]],
                    crs: L.CRS.Simple,
                    zoomControl: false 
                }).setView([height/2, width/2], 1);

                L.imageOverlay(this.src, imageBounds).addTo(locMap);

                // Disable drag and zoom handlers.
                //map.dragging.disable();
                locMap.touchZoom.disable();
                locMap.doubleClickZoom.disable();
                locMap.scrollWheelZoom.disable();
                locMap.keyboard.disable();

                // Disable tap handler, if present.
                if (locMap.tap) locMap.tap.disable();

                // Add features highlight to LocMap
                var featuresLayer = L.geoJson(featuresGeoJSON.filter(function(feature){
                    return protein.localizations.localizations.find(function(loc){
                        return loc == feature.properties.localization;
                    });
                }), {
                    pointToLayer: function (feature, latlng) {
                        return L.circle(latlng, {
                            radius: feature.properties.radius || 6
                        });
                    },
                    style: function(feature) {
                        if(feature.geometry.type == "LineString") {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 4,
                                opacity: .8,
                                fillOpacity: .8
                            };
                        } else {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 0,
                                opacity: .8,
                                fillOpacity: .8
                            };
                        }
                    }
                });

                featuresLayer.addTo(locMap);

                // INTERACTIONS MAP
                interMap = L.map('interMap', {
                    maxZoom: 4,
                    minZoom: 0,
                    maxBounds: [[-100, width+100], [height+100, -100]],
                    crs: L.CRS.Simple,
                    zoomControl: false 
                }).setView([height/2, width/2], 1);

                L.imageOverlay(this.src, imageBounds).addTo(interMap);

                // Disable drag and zoom handlers.
                //map.dragging.disable();
                interMap.touchZoom.disable();
                interMap.doubleClickZoom.disable();
                interMap.scrollWheelZoom.disable();
                interMap.keyboard.disable();

                // Disable tap handler, if present.
                if (interMap.tap) interMap.tap.disable();

                var root = addToInteractionMap(protein, "blue");

                if(root !== undefined){
                    root.addTo(interMap);
                    partners.forEach(function(partner){
                        var p = addToInteractionMap(partner);
                        if(p !== undefined){
                            p.addTo(interMap);
                            var polyline = L.polyline([root.getLatLng(),p.getLatLng()], {
                                color: 'gray',
                                opacity: .5,
                                dashArray: "1, 15",
                                weight: 2
                            });
                            
                            polyline.addTo(interMap);
                        }
                    });
                }

                // Fade
                $(".leaflet-image-layer").css("opacity",.1);
                hideProgress();
            }
        }
    });
})();