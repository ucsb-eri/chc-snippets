// This file contains utility functions and options

"use strict";

// Constants
const SMPG_COOKIE_PREFIX = 'SMPG_';
const DARKMODE_COOKIE_NAME = `${SMPG_COOKIE_PREFIX}DARKMODE`;
const MENU_HIDE_STATE_COOKIE_NAME = `${SMPG_COOKIE_PREFIX}MENU_HIDE_STATE`;

const SHORT_NAMES = {
    "Pentad": "Ptd.",
    "Dekad": "Dek.",
    "Month": "Mth.",
};

const HIDE_CLASS = 'w3-hide';

function navigateTo(queryParams={}, keepOlpParams=true) {
    const oldParams = keepOlpParams? getHashParamsObject() : {};
    const newParams = {...oldParams, ...queryParams };
    const paramsString = new URLSearchParams(newParams).toString();
    window.location.hash = paramsString;
}

function handleNavigation(event) {
    const oldUrl = event.oldURL;
    const newUrl = event.newURL;
    const params = getHashParamsObject();
    let selectedStationId = params['station'];
    
    if (getHashParams(oldUrl, 'country') !== getHashParams(newUrl, 'country')) {
        window.location.reload()
    }

    if (!selectedStationId) {
        navigateTo('station', currentDataIndex);
        return;
    }

    if (Object.keys(pawsData).includes(selectedStationId)){
        currentDataIndex = selectedStationId;
    }
    else{
        navigateTo('station', pawsFirstEntry);
        currentDataIndex = pawsFirstEntry;
        selectedStationId = pawsFirstEntry;
        return;
    }
    let headerText = `Station ID: ${pawsStationProperties[selectedStationId].station_name} ${params['country'] ? ", Country: " + params['country'] : ""}`;

    HEADER.text(headerText);

    for (const card of cards) {
        card.update(currentDataIndex);
    }

    if(previousSelectionElement != null) {
        previousSelectionElement.classList.remove('selected');
    }
    sidebarElements[currentDataIndex].classList.add('selected');

    previousSelectionElement = sidebarElements[currentDataIndex];
}

function handleResize(event) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        contentHeight = Math.max(900, window.innerHeight - d3.select("#contentHeader").node().getBoundingClientRect().height);
        grid.cellHeight(contentHeight/GS_V_RES);
        for (const card of cards) {
            for (const elementKey of Object.keys(card.cardElements)) {
                if (["map", "plot"].includes(elementKey)) {
                    const container = card.cardBody.node();
                    // Get container dimensions
                    const rect = container.getBoundingClientRect();
                    const width = rect.width;
                    const height = rect.height;

                    card.cardElements[elementKey].resize([width, height]);
                }
            }
        }
    }, resizeDelay);
}

function getHashParams(source = window.location.hash, param = null) {
    // If source is a full URL, extract the hash; otherwise use as is
    const hash = source.includes('://') ? new URL(source).hash : source;
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);

    if (param) {
        return hashParams.get(param);
    } else {
        return hashParams;
    }
}

function getHashParamsObject(source = window.location.hash) {
    const urlSearchParams = getHashParams(source);
    return Object.fromEntries(urlSearchParams.entries());
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(name, value) {
    var date = new Date();
    date.setDate(date.getDate() + 1); // expire in 1 day

    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; SameSite=Strict`;
}

function isDeclared(variableName) {
    return typeof window[variableName] !== "undefined";   
}

function setDarkMode(value) {
    setCookie(DARKMODE_COOKIE_NAME, value);
    if (value === "true") {
        document.body.classList.add('darkmode');
    } else {
        document.body.classList.remove('darkmode');
    }
}

function toggleDarkMode() {
    setCookie(DARKMODE_COOKIE_NAME, document.body.classList.toggle('darkmode'));
}

function zip(...arrays) {
  const minLength = Math.min(...arrays.map(arr => arr.length));
  return Array.from({ length: minLength }, (_, i) => 
    arrays.map(arr => arr[i])
  );
}

function getLast(arr) {
    return arr[arr.length - 1];
}

function setMenuState(value) {
    setCookie(MENU_HIDE_STATE_COOKIE_NAME, value);
    if (!value || value === "true") {
        BODY.classList.add('sidebar-closed');
    } else if (value === "false") {
        BODY.classList.remove('sidebar-closed');
    }
}

function menuToggle() {
    setCookie(MENU_HIDE_STATE_COOKIE_NAME, BODY.classList.toggle('sidebar-closed'));
    window.dispatchEvent(new Event('resize'));
  }

function placeUnder(element, anchor) {
    const bbox = anchor.getBoundingClientRect();
    const xPos = anchor.style.left;
    const yPos = `${bbox.height + 10}px`;

    element.style.left = xPos;
    element.style.top = yPos;
}

function objectMap(obj, fn) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value], index) => [key, fn(value, key, index)])
    );
}

function decompress(data) {
    const compressedData = atob(data);
    const compressedDataString = compressedData.split('').map(function(x){return x.charCodeAt(0);});
    const compressedDataBin = new Uint8Array(compressedDataString);
    const decompressedString = pako.inflate(compressedDataBin, { to: 'string'});
    return decompressedString;
}

function csvParse(csvString, excludeIndex=true) {
    let obj = {};
    d3.csvParse(csvString, (data, i, columns) => {
        const typedData = d3.autoType(data, i, columns);
        const index = typedData[""];
        if(excludeIndex) {
            delete typedData[""];
        }
        obj[index] = typedData;
    })
    return obj;
}

function csvParseRows(csvString, excludeIndex=true) {
    let obj = {};
    d3.csvParseRows(csvString, (data, i) => {
        if (i === 0) {return;} // skip header
        let typedData = d3.autoType(data, i);
        const index = typedData[0];
        if(excludeIndex) {
            typedData = typedData.slice(1)
        } 
        obj[index] = typedData;
    })
    return obj;
}

function parseObjectCsv(obj) {
    return objectMap(obj, csvParse);
}

function parseRowsObjectCsv(obj) {
    return objectMap(JSON.parse(obj), csvParseRows);
}

function searchFunction(){
    // Declare variables
    var input, filter, ul, li, a, i;
    input = document.getElementById("placeSearch");
    filter = input.value.toUpperCase();
    ul = document.getElementById("placeList");
    li = ul.getElementsByTagName("li");

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].classList.remove('place-hidden');
        } else {
            li[i].classList.add('place-hidden');
        }
    }
}

function confirmSearch(event) {
    if(event.key === 'Enter') {
        const placeList = document.getElementById("placeList");
        const selectedPlace = placeList.querySelector('.place-list-element:not(.place-hidden)');
        selectedPlace.firstChild.click();
        console.log(selectedPlace, 'clicked');
    }
}

function makeSelectionMenu(data) {
    const ids = Object.keys(data);
    const sidebarList = document.getElementById('placeList');
    let sidebarElements = {};
    for (const place of ids.toSorted()) {
        const listElement = document.createElement('li');
        listElement.className = 'place-list-element';
        const placeLink = document.createElement('a');
        listElement.appendChild(placeLink);
        sidebarElements[place] = placeLink;
        placeLink.id = place;
        placeLink.className = 'w3-bar-item w3-button w3-ripple';
        placeLink.innerHTML = data[place].station_name;
        placeLink.addEventListener('click', function () {
            navigateTo({"station": place});
        });
        sidebarList.appendChild(listElement);
    }
    return sidebarElements;
}

function updateSelect(selectElement, items) {
    selectElement.selectAll("option")
        .data(items)
        .join(
            enter => enter.append("option")
                .attr("value", d => d)
                .text(d => d),
            update => update, // Existing elements don't need changes if data matches
            exit => exit.remove() // Remove options no longer in the data
        );
}

function categorizeValue(value, bins) {
    for (const [binName, binData] of Object.entries(bins)) {
        const binFunction = binData['function'];
        if (binFunction(value)) {
            return binName;
        }
    }
    return 'Uncategorized';
    
}

function getColors(bins) {
    return Object.values(bins).map(bin => bin.color);
}

function showModal(message) {
    MODAL.style.display = "block";
    MODAL_HEADER.textContent = "Warning";
    MODAL_TEXT.innerHTML = message;
}

function closeModal() {
    MODAL.style.display = "none";
    MODAL_HEADER.textContent = "";
    MODAL_TEXT.innerHTML = "";
}

function add_widget(options) {
    gridstackWidgetCount++;
    let defaultOptions = {
        smpgCardType: "Disabled",

        id: `item${gridstackWidgetCount}`,
        w: 2,
        h: 2,
        ...options
    }
    grid.addWidget(defaultOptions);
    cards.push(new chartCard(`[gs-id="${defaultOptions['id']}"] .grid-stack-item-content`,
        defaultOptions['smpgCardType']),)
}

function toggleLayoutEdit() {
    editingLayout = !editingLayout;
    EDIT_LAYOUT_BUTTON.classed("w3-hide", editingLayout);
    STOP_EDIT_LAYOUT_BUTTON.classed("w3-hide", !editingLayout);
    ADD_WIDGET_BUTTON.classed("w3-hide", !editingLayout);
    SORT_LAYOUT_BUTTON.classed("w3-hide", !editingLayout)
    grid.setStatic(!editingLayout);
}








function objectGroupBy(field, data = [], options = { flat: false }) {
    // If flat is requested and data is already grouped (an object), flatten it first
    if (options.flat && !Array.isArray(data)) {
        const flattenedData = Object.values(data).flat();
        return objectGroupBy(field, flattenedData, options);
    }

    // Standard grouping logic for arrays
    if (Array.isArray(data)) {
        return data.reduce((accumulated, currentObj) => {
            const key = currentObj[field];
            if (!accumulated[key]) accumulated[key] = [];
            accumulated[key].push(currentObj);
            return accumulated;
        }, {});
    }

    // Stacked grouping: if data is an object, apply grouping to each of its groups
    const groupedObjects = {};
    for (const key in data) {
        groupedObjects[key] = objectGroupBy(field, data[key], options);
    }
    return groupedObjects;
}

function objectsToLists(objects) {
    if (!objects || objects.length === 0) {
        return {};
    }

    const keys = Object.keys(objects[0]);
    
    return keys.reduce((result, key) => {
        result[key] = objects.map(obj => obj[key]);
        return result;
    }, {});
}

function parseFileIndexHtmlToList(htmlText) {
    const files = [];

    // Parse the HTML text
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Select all rows in the table body
    const rows = doc.querySelectorAll('#list tbody tr');

    rows.forEach(row => {
        const linkElement = row.querySelector('td.link a');
        const sizeElement = row.querySelector('td.size');
        const dateElement = row.querySelector('td.date');

        if (linkElement) {
            const fileName = linkElement.textContent.trim();
            const url = linkElement.getAttribute('href');

            // Skip the "Parent directory" entry
            if (fileName === 'Parent directory/') return;

            files.push({
                name: fileName,
                url: url,
                size: sizeElement ? sizeElement.textContent.trim() : null,
                date: dateElement ? dateElement.textContent.trim() : null
            });
        }
    });

    return files;
}