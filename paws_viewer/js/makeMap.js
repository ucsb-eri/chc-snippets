// This file contains the code to construct the map

"use strict";

const UNCAT_COLOR = '#aaaf';
let mapStatsCategories = {
    'None': { 'Uncategorized': {color:UNCAT_COLOR, 'function': () => true} },
}

class d3Map {
    constructor(containerElement, geoJsonMap, geoJsonReferenceMap) {
        this.geoJsonMap = geoJsonMap;
        this.geoJsonReferenceMap = geoJsonReferenceMap;

        this.currentDisplayField = idField

        const layerArea = d3.geoArea(geoJsonReferenceMap);
        const layerBounds = d3.geoBounds(geoJsonReferenceMap);

        this.FONT_SIZE = 13;
        this.internal_width = 800;
        this.internal_height = 800;

        // Create SVG container
        this.svg = containerElement.append("svg")
            .attr("class", "map-svg")
            // .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0, 0, ${this.internal_width}, ${this.internal_height}`)

        const stations = Object.values(pawsStationProperties);

        // Create GeoJSON FeatureCollection from stations
        const stationsGeoJson = {
            type: "FeatureCollection",
            features: stations.map(s => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [s.lon, s.lat] },
                data: {...s}
            }))
        };

        const padding = 50;
        this.projection = d3.geoMercator()
            .fitSize([this.internal_width - padding * 2, this.internal_height - padding * 2], mapJson.features.find(item => item.properties.name === locationParam) || stationsGeoJson) // Fit the map to the SVG viewport size
        

        // Draw the map
        this.polygons = this.svg.append("g")
            .attr("class", "map-polygons zoomable")
            .selectAll(".country")
            .data(this.geoJsonMap.features)
            .enter().append("path")
            .attr("class", d => `country country-${d.properties[idField]} w3-ripple`)
            .attr("d", d3.geoPath().projection(this.projection))
            .style("fill", UNCAT_COLOR)

        this.stations = this.svg.append("g")
            .attr("class", "map-stations zoomable")
            .selectAll(".map-stations")
            .data(Object.values(pawsStationProperties))
            .enter().append("circle")
                .attr("class", d => `station station-${d.id} w3-ripple`)
                .attr("transform", d => `translate(${this.projection([d.lon, d.lat])})`)
                .attr("r", 4)
                .style("fill", "#00f4")
                .style("stroke", "#00ff")
                .style("stroke-width", .4)
                .on("mouseover", (event, d) => {
                    mapSelectorPath
                    .attr("transform", `translate(${this.projection([d.lon, d.lat])})`)
                    .style("display", null)
                })
                .on("mouseout", (event, d) => {
                    mapSelectorPath
                    .style("display", "none")
                })
                .on("click", (event, d) => {
                    this.update(d.id);
                    navigateTo({"station": d.id});
                })
                
        this.voronoiStations = this.svg.append("g")
            .attr("class", "map-stations-voronoi zoomable")
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("pointer-events", "all")
            .selectAll("path")
            .data(d3.geoVoronoi().polygons(stationsGeoJson).features)
            .join("path")
            .attr("d", d3.geoPath(this.projection))
            .on("mouseover", (event, d) => {
                mapSelectorPath
                .attr("transform", `translate(${this.projection([d.properties.site.data.lon, d.properties.site.data.lat])})`)
                .style("display", null)
            })
            .on("mouseout", (event, d) => {
                mapSelectorPath
                .style("display", "none")
            })
            .on("click", (event, d) => {
                this.update(d.properties.site.data.id);
                navigateTo({"station": d.properties.site.data.id});
            })
            .append("title")
            .text(d => d.properties.site.data.id)

        // draw selection bounding box rectangle
        this.mapPersistentSelectorPath = this.svg.append("g")
            .attr("class", "map-persistent-selector zoomable")
            .append("circle")
                .attr("class","persistent-selection-path")
                .style("display", "none")
                .attr("r", 4)
        const mapSelectorPath = this.svg.append("g")
            .attr("class", "map-selector zoomable")
            .append("circle")
                .attr("class","selection-path")
                .style("display", "none")
                .attr("r", 4)

        // this.polygonTooltips = this.polygons.append("title")
        //     .attr("class", "country-polygon-tooltip")
        //     .text(d => d.properties[idField])
            
        // draw labels
        this.labels = this.svg.append("g")
            .attr("class", "map-labels zoomable")
            .selectAll(".map-text-label")
            .data(this.geoJsonMap.features)
            .enter().append("text")
            .text(d => d.properties[idField])
            .attr("class", "map-text-label svg-outline-text")
            .attr("transform", d => `translate(${this.projection(d3.geoCentroid(d))})`)
            .attr("font-size", this.FONT_SIZE)
            .style("dominant-baseline", "middle")
            // .style("text-anchor", "middle")

        this.legend = this.svg.append("g")
            .attr("class", "map-legend");

        // Define the zoom behavior
        this.svgZoomHandler = d3.zoom()
        .filter((event) => {
            // Discard one finger touch events
            if (event.type === "touchstart" && event.touches.length < 2) {
                return false;
            }
            return true;
        })
        .scaleExtent([0.9, 8])
        .translateExtent([[this.internal_width*-0.1, this.internal_height*-0.1],
            [this.internal_width*1.1, this.internal_height*1.1]])
        .on('zoom', (event) => {
            this.svg.selectAll(".zoomable")
            .attr("transform", event.transform)
            .attr("stroke-width", 1 / event.transform.k);
        });
        this.svg.call(this.svgZoomHandler);
    }

    update(index) {
        // Mark current entry on map
        this.mapPersistentSelectorPath
            .attr("transform", d => `translate(${this.projection([pawsStationProperties[index].lon, pawsStationProperties[index].lat])})`)
            .style("display", null)
    }

    changeLabels(fieldId) {
        // Update label text based on the selected property
        this.currentDisplayField = fieldId;
        this.labels.text(d => d.properties[fieldId]);
        this.polygonTooltips.text(d => d.properties[fieldId]);
    }

    changeLegend(statId) {
        const selectedBins = mapStatsCategories[statId];
        // Update legend based on the selected property
        const legendElementHeight = 16;
        const legendElementGap = 1;
        const startY = this.internal_height - 30;
        const startX = this.internal_width - 30;
        const coordX = startX;

        this.legend.selectChildren().remove()
        if (statId !== "None") {
            this.legend.selectAll().append("g")
                .data(Object.entries(selectedBins))
                .join("g")
                .attr("class", "legend-element")
                .attr("transform", (d, i, nodes) => {
                    const offset = nodes.length - i - 1;
                    const coordY = startY - (offset * (legendElementHeight + legendElementGap));
                    return `translate(${coordX},${coordY})`;
                })
                .call(g => { //populate legend elements
                    g.append("rect")
                        .attr("width", 16)
                        .attr("height", 16)
                        .attr("fill", d => d[1].color);
                        // .attr("stroke", "#000f")
                        // .attr("stroke-width", 1)
                    g.append("text")
                        .attr("class", "legend-labels svg-outline-text")
                        .attr("x", -4)
                        .attr("y", 9)
                        .attr("dy", "0")
                        .attr("font-size", this.FONT_SIZE)
                        .attr("text-anchor", "end")
                        .style("dominant-baseline", "middle")
                        .text(d => d[0]);
                    })
                .call(g => { // add title
                    const offset = g.size() - 1;
                    const coordY = startY - (offset * (legendElementHeight + legendElementGap));
                    this.legend.append("text")
                        .text(statId)
                        .attr("class", "legend-title svg-outline-text")
                        .attr("x", 20)
                        .attr("y", -9)
                        .attr("dy", "0")
                        .attr("font-size", this.FONT_SIZE)
                        .attr("text-anchor", "end")
                        .style("dominant-baseline", "middle")
                        .attr("transform", `translate(${coordX},${coordY})`)
                    })
                .each((d, i, nodes) => {
                    // console.log(nodes[i].getBoundingClientRect().width);
                })
        }
            
        // Update polygon color based on the selected property
        let hasUncategorizedPolygons = false;
        // this.polygons.style("fill", d => {
        //     let category = "Uncategorized";

        //     if (datasetProperties['place_ids'].includes(String(d.properties[idField]))) {
        //         const value = getPlaceMapStats(d.properties[idField])[statId];
        //         category = categorizeValue(value, selectedBins);
        //     }
        //     // check if there is any uncategorized polygon
        //     hasUncategorizedPolygons |= (category === "Uncategorized");
            
        //     if (statId === "None") {
        //         return UNCAT_COLOR;
        //     }
        //     if (category === "Uncategorized") {
        //         return mapStatsCategories[""]["color"];
        //     }
        //     return selectedBins[category]["color"];
        // });
        if (hasUncategorizedPolygons && statId !== "None") {
            // add a legend for uncategorized polygons
            showModal(`There was missing data when drawing map.<br>Please check for a possible mismatch between the dataset and the selected target field from the shapefile.<br>Target Field: ${parameters.target_id_field}`)
        }
    }

    resize(size=null) {
        size = size || [this.svg.node().parentElement.clientWidth, 
                        this.svg.node().parentElement.clientHeight];
        this.svg.attr('viewBox', `0 0 ${this.internal_width} ${this.internal_height}`);
    }
}

function makeD3Map(containerElement) {
    const map = new d3Map(containerElement, mapJson, referenceMapJson);
    return map;
}

class mapControlPanel {
    constructor(containerElement, map, description) {
        this.containerElement = containerElement;

        this.controlPanelContainer = containerElement.append("div")
            .attr("class", "map-control-panel-container w3-card capture-ignore w3-hide");
        
        // Header
        this.controlPanelHeader = this.controlPanelContainer.append("header")
            .attr("class", "card-header w3-blue-grey");
            
        // Buttons
        this.headerButtonGroup = this.controlPanelHeader.append("div");
        this.hideButton = this.headerButtonGroup.append("span").append("button")
            .attr("class", "card-button mi w3-button w3-ripple w3-right capture-ignore")
            .attr("title", "Hide Map Control Panel")
            .text("close")
            .on("click", () => {
                this.controlPanelContainer.classed("w3-hide", true)
            });

        // Title
        this.controlPanelHeader.append("div")
            .attr("class", "card-title-select")
            .append("p")
                .attr("class", "card-title")
                .text("Map Parameters");
        
        // Body
        this.controlPanelBody = this.controlPanelContainer.append("div")
            .attr("class", "w3-container w3-padding-small");

        // Label select
        this.controlPanelBody.append("label")
            .text("Label Field");
        this.labelFieldSelect = this.controlPanelBody.append("select")
            .attr("class", "w3-block w3-border")
            .on("change", (event) => {
                const displayId = event.target.value;
                map.changeLabels(displayId);
            });
        updateSelect(this.labelFieldSelect, property_ids);
        this.labelFieldSelect.property("value", idField);

        // this.controlPanelBody.append("br");

        // // Stat select
        // this.controlPanelBody.append("label")
        //     .text("Legend Stat");
        // this.legendStatSelect = this.controlPanelBody.append("select")
        //     .attr("class", "w3-block w3-border")
        //     .on("change", (event) => {
        //         const selectedStatId = event.target.value;
        //         map.changeLegend(selectedStatId);
        //         description.changeStat(selectedStatId);
        //     });
        // updateSelect(this.legendStatSelect, mapFields);

        // // Show legend checkbox
        // this.showLegendCheckbox = this.controlPanelBody.append("input")
        //     .attr("class", "w3-check")
        //     .attr("type", "checkbox")
        //     .attr("checked", "checked")
        //     .on("change", (event) => {
        //         const showLegend = event.target.checked;
        //         map.legend.style("display", showLegend? null : "none");
        //     });
        // this.controlPanelBody.append("label")
        //     .text("Show Legend");

        // this.controlPanelBody.append("br");

        // // Show description checkbox
        // this.showDescriptionCheckbox = this.controlPanelBody.append("input")
        //     .attr("class", "w3-check")
        //     .attr("type", "checkbox")
        //     .attr("checked", "checked")
        //     .on("change", (event) => {
        //         const state = event.target.checked;
        //         description.mapDescriptionContainer.classed("w3-hide", !state)
        //     });
        // this.controlPanelBody.append("label")
        //     .text("Show Map Description");

        // Reset viewport button
        this.resetViewportButton = this.controlPanelBody.append("button")
            .attr("class", "w3-button w3-input w3-ripple w3-border w3-section w3-light-gray w3-hover-blue-grey")
            .text("Reset Map Viewport")
            .on("click", (event) => {
                map.svg.call(map.svgZoomHandler.transform, d3.zoomIdentity);
            });
    }

    update(index) {}
}

class mapDescription {
    constructor(containerElement) {
        this.containerElement = containerElement;
        this.show = false;

        this.mapDescriptionContainer = this.containerElement.append("div")
            .attr("class", "map-description-container w3-margin w3-hide")

        this.mapDescriptionIcon = this.mapDescriptionContainer.append("span")
            .attr("class", "map-description-icon mi w3-margin-right capture-ignore")
            .text("info")

        this.mapDescriptionText = this.mapDescriptionContainer.append("span").append("p")
           .attr("class", "map-description-text w3-leftbar")
    }

    changeStat(statId) {
        if (!mapDescriptions[statId]) {
            this.mapDescriptionContainer.classed("w3-hide", true)
            this.mapDescriptionText.text()
            return;
        }
        this.mapDescriptionContainer.classed("w3-hide", false)
        this.mapDescriptionText.text(mapDescriptions[statId])
    }

    changeVisibility(state) {
        this.show = state;
        this.mapDescriptionContainer.classed("w3-hide", !state)
    }

    update(index) {}
}

function makeMapCard(containerElement) {
    const allContainer = containerElement.append("div")
        .attr("class", "map-container")

    const map = makeD3Map(allContainer);
    const description = new mapDescription(allContainer);
    const controlPanel = new mapControlPanel(allContainer, map, description);
    return {
        "map": map,
        "controlPanel": controlPanel,
        "mapDescription": description,
    };
}