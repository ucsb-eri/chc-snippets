// This file contains the main logic that initializes the page

"use strict";

// uninitialized variables
var pawsFilesData, pawsFirstEntry, pawsData, pawsStationProperties, pawsSeries, pawsFirstEntry,
    currentDataIndex, locationParam, mapJson, referenceMapJson, property_ids,
    grid, cards, sidebarElements,
    GS_H_CELL_SIZE, GS_H_RES, GS_V_CELL_SIZE, GS_V_RES;

// Globals
var pawsToolVersion = '1.0';
var fileIndexUrl = 'https://data.chc.ucsb.edu/people/saldivar/3dpaws/logs/';

var pawsIdField = "station_seqnum";
var pawsFiles = {};
var pawsParsedCSV = [];
var previousSelectionElement = null;
var resizeTimeout = false; // holder for timeout
var resizeDelay = 300; // debounce delay
var contentHeight = null;
var gridstackWidgetCount = null;
var editingLayout = false;

const hasMap = isDeclared("topojson_map") && topojson_map !== null;
const hasReferenceMap = isDeclared("reference_topojson_map") && reference_topojson_map !== null;
const mapFields = ['None'];
var idField = 'SMPG_names';

// HTML Elements
const BODY = document.body;
const HEADER = d3.select('#contentHeaderText');
const MODAL = document.getElementById('modal');
const MODAL_HEADER = document.getElementById('modalHeaderText');
const MODAL_TEXT = document.getElementById('modalText');
const GRIDSTACK_ROOT = d3.select('.gridstackRoot');
const ADD_WIDGET_BUTTON = d3.select('#addWidgetButton');
const EDIT_LAYOUT_BUTTON = d3.select('#editLayoutButton');
const STOP_EDIT_LAYOUT_BUTTON = d3.select('#stopEditLayoutButton');
const SORT_LAYOUT_BUTTON = d3.select('#sortLayoutButton');

function initDashboard() {
    // Decompress and parse data

    locationParam = getHashParamsObject()['country'];
    if (locationParam) {
        const dataByCountry = objectGroupBy('country', pawsParsedCSV);
        
        if (Object.keys(dataByCountry).includes(locationParam)) {
            pawsData = objectGroupBy(pawsIdField, dataByCountry[locationParam]);
        } else {
            pawsData = objectGroupBy(pawsIdField, pawsParsedCSV);
        }
    } else {
        pawsData = objectGroupBy(pawsIdField, pawsParsedCSV);
    }
    
    pawsFirstEntry = Object.keys(pawsData)[0];
    
    pawsStationProperties = objectMap(pawsData, (value, key, index) => {
        return {
            id: key,
            local_id: value[0].local_id,
            country: value[0].country,
            lat: value[0].latitude,
            lon: value[0].longitude,
        }
    });

    pawsSeries = objectMap(pawsData, (value, key, index) => {
        return objectsToLists(value);
    })
    
    // Global data properties
    
    currentDataIndex = pawsFirstEntry;
    
    // Initialize map data
    if(hasMap) {
        var topoJsonObjectMap = topojson_map;
        var referenceTopoJsonObjectMap = topoJsonObjectMap;
    
        mapJson = topojson.feature(topoJsonObjectMap, topoJsonObjectMap.objects.countries);
        referenceMapJson = topojson.feature(referenceTopoJsonObjectMap, referenceTopoJsonObjectMap.objects.countries);
    
        // Populate stat selects
        property_ids = Object.keys(Object.values(mapJson["features"])[0]["properties"]);
        property_ids.splice(0, 0, "None"); // Add None element
    }
    
    // Debug data logs
    console.log('pawsParsedCSV', pawsParsedCSV);
    console.log('pawsData', pawsData);
    console.log('pawsStationProperties', pawsStationProperties);
    console.log('pawsSeries', pawsSeries);
    
    
    GS_H_RES = 12;
    GS_V_RES = 8;
    GS_H_CELL_SIZE = Math.round((1/3) * GS_H_RES);
    GS_V_CELL_SIZE = Math.round((1/2) * GS_V_RES);
    
    var gridstackOptions = {
        animate: false,
        float: true,
        // row: 6,
        column: GS_H_RES,
        // handle: ".card-header",
        resizable: { handles: 'all'},
        staticGrid: true,
        columnOpts: {
            breakpointForWindow: false,
            layout: 'list',
            columnMax: GS_H_RES,
            breakpoints: [
                {w:800,  c:GS_H_CELL_SIZE*1},
                {w:1100, c:GS_H_CELL_SIZE*2},
                {w:1280, c:GS_H_CELL_SIZE*3},
            ]
        },
    };
    
    var gridstackItems = [
        {
            id: "item2",
            w: GS_H_CELL_SIZE*1.5,
            h: GS_V_CELL_SIZE*2,
        },
        {
            id: "item1",
            w: GS_H_CELL_SIZE*1.5,
            h: GS_V_CELL_SIZE*2,
        },
    ];
    gridstackWidgetCount = gridstackItems.length;
    grid = GridStack.init(gridstackOptions);
    grid.load(gridstackItems);
    
    // set page state using cookies
    setDarkMode(getCookie(DARKMODE_COOKIE_NAME));
    setMenuState(getCookie(MENU_HIDE_STATE_COOKIE_NAME));
    
    cards = [
        new chartCard('[gs-id="item1"] .grid-stack-item-content', "PAWS"),
        new chartCard('[gs-id="item2"] .grid-stack-item-content', "Map"),
    ];
    
    sidebarElements = makeSelectionMenu(Object.keys(pawsData)); //init places list
    
    window.addEventListener("hashchange", handleNavigation); // update everything when the url changes
    window.addEventListener("resize", handleResize);
    grid.on("resize resizestop", handleResize);
    
    navigateTo({"station": getHashParamsObject()['station'] || pawsFirstEntry});
    window.dispatchEvent(new HashChangeEvent('hashchange',
        {
            oldURL: location.href,
            newURL: location.href
        }
    )); // initial update
    window.dispatchEvent(new Event('resize'));
}

async function loadDataAndInit() {
    try {
        const response = await fetch(fileIndexUrl);
        const fileIndexHTML = await response.text();
        const pawsFilesMetadata = parseFileIndexHtmlToList(fileIndexHTML);

        pawsFilesData = await getFilesWithCache(pawsFilesMetadata, pawsToolVersion);
        for (const fileData of pawsFilesData) {
            pawsParsedCSV = pawsParsedCSV.concat(d3.csvParse(fileData.content));
        }
        
        initDashboard();
    } catch (error) {
        console.error('Error loading index:', error);
    }
}

loadDataAndInit();