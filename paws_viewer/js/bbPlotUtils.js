// This file contains utility functions and options for the plots

"use strict";

function arrayMoreLess20(numbers) {
    return numbers.map(n => [n * (1 + .2), n, n * (1 - .2)]);
}
function getUpTo(places, index) {
    return Object.values(places).map(place => place[index]);
}
function genxs(dataIds, length, customxs = {}, defaultxs = 'data_xs') {
    const xs = ascendingArray(length);
    return Object.fromEntries(dataIds.map(id => [id, (id in customxs) ? customxs[id] : defaultxs]));
}
function extendScalar(value, length) {
    return new Array(length).fill(value);
}
function ascendingArray(n, offset=0) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(i + offset);
    }
    return arr;
}
function getLegend(title, color, data, chartTypes = {}, points = {}) {
    let chartType = '';
    switch (chartTypes[title]) {
        case 'scatter':
            chartType = 'fiber_manual_record'
            break;
        case 'area-line-range':
            chartType = 'area_chart'
            break;
        case 'bar':
            chartType = 'bar_chart'
            break;
        case 'area':
            chartType = 'area_chart'
            break;
        default:
            chartType = 'show_chart';
            break;
    }
    return `<span style='padding:2px; font-size:10.5px;'><span class="mi mi-button" style="color:${color};">${chartType}</span> ${title}</span>`;
}

const defaultOptions = {
    axis: {
        x: {
            // min: .5,
            // max: 35,
            label: {
                text: 'Time',
                position: 'outer-right',
            },
            tick: {
                rotate: -35,
                // autorotate: true,
                culling: { max: '13' },
                // multiline: false,
            },
            padding: {
                // left: 1,
                // right: 0,
            },
        },
        y: {
            // min: 0,
            label: {
                text: 'Rainfall (mm)',
                position: 'outer-top',
            },
            padding: {
                bottom: 10,
            },
        },
        // y2: {
        //     show: true,
        // },
    },
    grid: {
        x: {
            show: true,
            // lines: [
            //     {value: 4.5, text: 'Lable 4.5', position: 'start'},
            // ]
        },
        y: {
            show: true,
        },
    },
    legend: {
        // usePoint: true,
    },
    tooltip: {
        order: 'desc',
        grouped: true,
        position: function (data, width, height, element, pos) {
            // get root svg from element
            let svg = element;
            while (svg && svg.tagName !== 'svg') {
                svg = svg.parentElement;
            }
            // use d3 to get properties of root svg
            svg = d3.select(svg);
            const viewBox = svg.attr('viewBox').split(' ').map(Number);
            const svgWidth = svg.node().getBoundingClientRect().width;
            const svgHeight  = svg.node().getBoundingClientRect().height;
            // calculate final coordinates
            const scaleX = svgWidth / viewBox[2];
            const scaleY  = svgHeight / viewBox[3];
            let transformedX = pos.xAxis * scaleX;
            let transformedY = pos.y * scaleY;
            // avoid out of bounds
            if(transformedX + width > svgWidth) {transformedX -= width;}
            if (transformedY + height > svgHeight) {transformedY -= height;}

            return {
                top: transformedY,
                left: transformedX
            };
        },
    },
    point: {
        show: false,
    },
    transition: {
        duration: false,
    },
    line: {
        point: false,
    },
    area: {
        front: false,
    },
    padding: {
        mode: 'fit',
    },
    bar: {
        front: true,
    },
    resize: {
        auto: "viewBox",
    },
};
const chartColors = {
    'LTA': '#FF0000',
    'Median': '#000000',
    'LTA±20%': '#00AFE5',
    'Climatology Average': '#FF0000',
    'Ensemble Med.': '#000000',
    'Ensemble Med. w/ Forecast': '#000000',
    'Current Season': '#0000FF',
    'Seasonal Accumulation': '#78ADD2',
    'Current Season Accumulation': '#0000FF',
    'Current Season Accumulation with Forecast': '#0000FF',
    'Current Accumulation to Present': '#0000FF',
    'Forecast': '#FF00FF',
    'Forecast Accumulation': '#FF00FF',

    '67 Pctl.': '#00FF00',
    'D0: 31 Pctl.': '#FFFF00',
    'D1: 21 Pctl.': '#FCD37F',
    'D2: 11 Pctl.': '#FFAA00',
    'D3: 6 Pctl.': '#E60000',
    'D4: 3 Pctl.': '#730000',

    'LTA±St. Dev.': '#008000',
    '(33, 67) Pctl.': '#000000',
    'E. LTA±St. Dev.': '#FFA500',
    'E. LTA w/ Forecast±St. Dev.': '#FFA500',
    'E. (33, 67) Pctl.': '#0000FF',
    'E. w/ Forecast (33, 67) Pctl.': '#0000FF',
}