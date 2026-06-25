// This file contains the code to construct the specific plots

"use strict";

function makeAccumulationsPlot(containerElement) {
    let xNames = [...datasetProperties['sub_season_monitoring_ids']];
    let xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
        'scatter_xs': [xNames.length - 1, xNames.length - 1],
        'forecast_xs': ascendingArray(Math.max(parameters.forecast_length + 1, 1), currentMonitoringLength - 1),
    };
    const xsDataRelation = {
            'Forecast Accumulation': 'forecast_xs',
            'LTA±St. Dev.': 'scatter_xs',
            '(33, 67) Pctl.': 'scatter_xs',
    };
    const plotTypes = {
            'LTA±20%': 'area-line-range',
            'LTA±St. Dev.': 'scatter',
            '(33, 67) Pctl.': 'scatter',
    };
    const getAccumulationsPlotData = (index) => {
        let data = {
            ...selected_seasons_cumsum[index],
            'Median': seasonal_long_term_stats[index]['Median'],
            'LTA±20%': arrayMoreLess20(seasonal_long_term_stats[index]['LTA']),
            'LTA': seasonal_long_term_stats[index]['LTA'],
            'Current Season Accumulation':place_long_term_stats[index]['Current Season Accumulation']
            .slice(monitoringOffset),
            'LTA±St. Dev.': [
                seasonal_general_stats[index]['LTA'] + seasonal_general_stats[index]['St. Dev.'],
                seasonal_general_stats[index]['LTA'] - seasonal_general_stats[index]['St. Dev.'],
            ],
            '(33, 67) Pctl.': [
                place_general_stats[index]['Climatology 33 Pctl.'],
                place_general_stats[index]['Climatology 67 Pctl.'],
            ],
            'Forecast Accumulation': [
                place_general_stats[index]['Current Accumulation to Present'], 
                ...place_long_term_stats[index]['Forecast Accumulation']
                .slice(monitoringOffset+currentMonitoringLength),
            ],
        };
        return data;
    };
    const plot = new BBPlot(containerElement, getAccumulationsPlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes);
    return plot;
}

function makeAccumulationsTable(containerElement) {
    const getAccumulationsTableData = (index) => {
        let data = {};
        const assesmentTitle = `Assessment at Current ${period_unit}`;
        data[assesmentTitle] = [
            [null, 'Sel. Yrs.', 'Clim.'],
            [`LTA up to Current Season`, selected_seasons_general_stats[index]['LTA up to Current Season'], seasonal_general_stats[index]['LTA up to Current Season']],
            [`Total up to Current Season/LTA Pct.`, selected_seasons_general_stats[index]['Total up to Current Season/LTA Pct.'], seasonal_general_stats[index]['Total up to Current Season/LTA Pct.']],
        ]
        data["[hide header]"] = [
            [`Current Accumulation to Present`, place_general_stats[index]['Current Accumulation to Present']],
        ];
        if(hasForecast) {
            data["[hide header]"].push(
            [`Current Accumulation to Forecast`, place_general_stats[index]['Current Accumulation to Forecast']]);
        }

        return data;
    };

    const table = new Table(containerElement, getAccumulationsTableData)
    return table;
}

function makeAccumulationsCard(containerElement) {
    return {
        "plot": makeAccumulationsPlot(containerElement),
        "table": makeAccumulationsTable(containerElement),
    }
}

function makeCurrentYearPlot(containerElement) {
    let xNames = [...datasetProperties['sub_season_ids']];
    
    let xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
        'forecast_xs': ascendingArray(Math.max(parameters.forecast_length, 1), currentLength),
    };
    let xsDataRelation = {
        'Forecast': 'forecast_xs',
    };
    const plotTypes = {
        'Current Season': 'bar',
        'Forecast': 'bar',
        'Climatology Average': 'line',
    };
    const makeCurrentYearPlotData = (index) => {
        const xLength = seasonal_current_totals[index].length + 1;
        let data = {
            'Current Season': place_long_term_stats[index]['Current Season'],
            'Climatology Average': place_long_term_stats[index]['Climatology Average'],
            'Forecast': place_long_term_stats[index]['Forecast']
            .slice(currentLength),
        }
        return data;
    };
    const makeCurrentYearPlotGridLines = (index) => {
        let sosAvgClass = place_general_stats[index]['Start of Season of Avg.'];
        let sosCurrentClass = place_general_stats[index]['Start of Season'];
        let sosForecastClass = place_general_stats[index]['Forecast Start of Season'];
        let gridLines = [];
        if (place_general_stats[index]['Start of Season of Avg. Raw'] !== null) {
            gridLines.push({
            value: place_general_stats[index]['Start of Season of Avg. Raw'],
            text: 'SoS of Historical Avg.',
            position: "middle",
            class: "sos-marker avg-sos-marker"
            });
        } 
        if (place_general_stats[index]['Start of Season Raw'] !== null
            && sosCurrentClass !== null
        ) {
            gridLines.push({
            value: place_general_stats[index]['Start of Season Raw'],
            text: sosCurrentClass.startsWith('Possible Start') ? 'Possible SoS' : 'SoS of Current Season',
            position: "start",
            class: "sos-marker current-sos-marker"
            });
        }
        if (hasForecast
            && place_general_stats[index]['Forecast Start of Season Raw'] !== null
            && place_general_stats[index]['Forecast Start of Season Raw'] !== place_general_stats[index]['Start of Season Raw']
            && sosForecastClass !== null
        ) {
            gridLines.push({
            value: place_general_stats[index]['Forecast Start of Season Raw'],
            text: sosForecastClass.startsWith('Possible Start') ? 'Possible SoS of Forecast' : 'SoS of Forecast',
            position: "start",
            class: "sos-marker forecast-sos-marker"
            });
        }
        return gridLines;
    };
    const options = {
            bar: {
                zerobased: true,
            },
        }
    const plot = new BBPlot(containerElement, makeCurrentYearPlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes, makeCurrentYearPlotGridLines, options);
    return plot;
}

function makeCurrentYearTable(containerElement) {
    const getAccumulationsCurrentTableData = (index) => {
        let data = {
            "Seasonal Analysis": [
                [null, 'Sel. Yrs.', 'Clim.'],
                ['LTA', selected_seasons_general_stats[index]['LTA'], seasonal_general_stats[index]['LTA']],
                ['St. Dev.', selected_seasons_general_stats[index]['St. Dev.'], seasonal_general_stats[index]['St. Dev.']],
            ],
        }
        if (hasSos) {
            data["Rainy Season Status"] = [
                ['SoS', place_general_stats[index]['Start of Season']],
                ['SoS Anomaly', place_general_stats[index]['Start of Season Anomaly']],
            ];
            if (hasForecast) {
                data["Rainy Season Status"].push(['Forecast SoS', place_general_stats[index]['Forecast Start of Season']]);
                data["Rainy Season Status"].push(['Forecast SoS Anomaly', place_general_stats[index]['Forecast Start of Season Anomaly']]);
            }
        }
        return data;
    };

    const table = new Table(containerElement, getAccumulationsCurrentTableData)
    return table;
}

function makeCurrentYearCard(containerElement) {
    return {
        "plot": makeCurrentYearPlot(containerElement),
        "table": makeCurrentYearTable(containerElement),
    }
}

function makeEnsemblePlot(containerElement) {
    let xNames = datasetProperties['sub_season_monitoring_ids'];
    
    const xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
        'scatter_xs': [xNames.length - 1, xNames.length - 1],
    };
    const xsDataRelation = {
            'LTA±St. Dev.': 'scatter_xs',
            'E. LTA±St. Dev.': 'scatter_xs',
            '(33, 67) Pctl.': 'scatter_xs',
            'E. (33, 67) Pctl.': 'scatter_xs',
    };
    const plotTypes = {
            'LTA±20%': 'area-line-range',
            'LTA±St. Dev.': 'scatter',
            'E. LTA±St. Dev.': 'scatter',
            '(33, 67) Pctl.': 'scatter',
            'E. (33, 67) Pctl.': 'scatter',
    };
    const getEnsemblePlotData = (index) => {
        const xLength = seasonal_current_totals[index].length + 1;
        return {
            ...selected_seasons_ensemble[index],
            'LTA±20%': arrayMoreLess20(seasonal_long_term_stats[index]['LTA']),
            'LTA': seasonal_long_term_stats[index]['LTA'],
            'Ensemble Med.': selected_seasons_long_term_stats[index]['Ensemble Med.'],
            'Current Season Accumulation': place_long_term_stats[index]['Current Season Accumulation']
            .slice(monitoringOffset),
            'LTA±St. Dev.': [
                seasonal_general_stats[index]['LTA'] + seasonal_general_stats[index]['St. Dev.'],
                seasonal_general_stats[index]['LTA'] - seasonal_general_stats[index]['St. Dev.'],
            ],
            'E. LTA±St. Dev.': [
                selected_seasons_general_stats[index]['E. LTA'] + selected_seasons_general_stats[index]['St. Dev.'],
                selected_seasons_general_stats[index]['E. LTA'] - selected_seasons_general_stats[index]['St. Dev.'],
            ],
            '(33, 67) Pctl.': [
                place_general_stats[index]['Climatology 33 Pctl.'],
                place_general_stats[index]['Climatology 67 Pctl.'],
            ],
            'E. (33, 67) Pctl.': [
                selected_seasons_general_stats[index]['Ensemble 33 Pctl.'],
                selected_seasons_general_stats[index]['Ensemble 67 Pctl.'],
            ],
        }
    };
    const plot = new BBPlot(containerElement, getEnsemblePlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes);
    return plot;
}

function makeEnsembleTable(containerElement) {
    const getAccumulationsCurrentTableData = (index) => {
        return {
            "Projection at EoS": [
                [null, 'Sel. Yrs.', 'Clim.'],
                ['Ensemble Med.', selected_seasons_general_stats[index]['Ensemble Med.'], seasonal_general_stats[index]['Ensemble Med.']],
                ['LTA', selected_seasons_general_stats[index]['LTA'], seasonal_general_stats[index]['LTA']],
                ['Ensemble Med./LTA Pct.', selected_seasons_general_stats[index]['Ensemble Med./LTA Pct.'], seasonal_general_stats[index]['Ensemble Med./LTA Pct.']],
                ['Ensemble Med. Pctl.', selected_seasons_general_stats[index]['Ensemble Med. Pctl.'], selected_seasons_general_stats[index]['Ensemble Med. Pctl.']],
            ],
            "Probability at EoS": [
                [null, 'Sel. Yrs.', 'Clim.'],
                ['Above Normal', selected_seasons_general_stats[index]['Probability Above Normal'], seasonal_general_stats[index]['Probability Above Normal']],
                ['Normal', selected_seasons_general_stats[index]['Probability of Normal'], seasonal_general_stats[index]['Probability of Normal']],
                ['Below Normal', selected_seasons_general_stats[index]['Probability Below Normal'], seasonal_general_stats[index]['Probability Below Normal']],
            ]
        }
    };

    const table = new Table(containerElement, getAccumulationsCurrentTableData)
    return table;
}

function makeEnsembleCard(containerElement) {
    return {
        "plot": makeEnsemblePlot(containerElement),
        "table": makeEnsembleTable(containerElement),
    }
}

function makeEnsembleWithForecastPlot(containerElement) {
    let xNames = datasetProperties['sub_season_monitoring_ids'];
    
    const xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
        'scatter_xs': [xNames.length - 1, xNames.length - 1],
        'forecast_xs': ascendingArray(Math.max(parameters.forecast_length + 1, 1), currentMonitoringLength - 1),
    };
    const xsDataRelation = {
        'Forecast Accumulation': 'forecast_xs',
        'E. LTA w/ Forecast±St. Dev.': 'scatter_xs',
        'LTA±St. Dev.': 'scatter_xs',
        'E. LTA±St. Dev.': 'scatter_xs',
        '(33, 67) Pctl.': 'scatter_xs',
        'E. w/ Forecast (33, 67) Pctl.': 'scatter_xs',
    };
    const plotTypes = {
        'E. LTA w/ Forecast±St. Dev.': 'scatter',
        'LTA±20%': 'area-line-range',
        'LTA±St. Dev.': 'scatter',
        'E. LTA±St. Dev.': 'scatter',
        '(33, 67) Pctl.': 'scatter',
        'E. w/ Forecast (33, 67) Pctl.': 'scatter',
    };
    const getEnsemblePlotData = (index) => {
        const xLength = seasonal_current_totals[index].length + 1;
        return {
            ...selected_seasons_ensemble_with_forecast[index],
            'LTA±20%': arrayMoreLess20(seasonal_long_term_stats[index]['LTA']),
            'LTA': seasonal_long_term_stats[index]['LTA'],
            'Ensemble Med. w/ Forecast': selected_seasons_long_term_stats[index]['Ensemble Med. w/ Forecast'],
            'Current Season Accumulation': place_long_term_stats[index]['Current Season Accumulation']
            .slice(monitoringOffset),
            'LTA±St. Dev.': [
                seasonal_general_stats[index]['LTA'] + seasonal_general_stats[index]['St. Dev.'],
                seasonal_general_stats[index]['LTA'] - seasonal_general_stats[index]['St. Dev.'],
            ],
            'E. LTA w/ Forecast±St. Dev.': [
                selected_seasons_general_stats[index]['E. LTA w/ Forecast'] + selected_seasons_general_stats[index]['St. Dev.'],
                selected_seasons_general_stats[index]['E. LTA w/ Forecast'] - selected_seasons_general_stats[index]['St. Dev.'],
            ],
            '(33, 67) Pctl.': [
                place_general_stats[index]['Climatology 33 Pctl.'],
                place_general_stats[index]['Climatology 67 Pctl.'],
            ],
            'E. w/ Forecast (33, 67) Pctl.': [
                selected_seasons_general_stats[index]['Ensemble 33 Pctl. w/ Forecast'],
                selected_seasons_general_stats[index]['Ensemble 67 Pctl. w/ Forecast'],
            ],
            'Forecast Accumulation': [
                place_general_stats[index]['Current Accumulation to Present'], 
                ...place_long_term_stats[index]['Forecast Accumulation']
                .slice(monitoringOffset+currentMonitoringLength),
            ],
        }
    };
    const plot = new BBPlot(containerElement, getEnsemblePlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes);
    return plot;
}

function makeEnsembleWithForecastTable(containerElement) {
    const getAccumulationsCurrentTableData = (index) => {
        return {
            "Projection at EoS": [
                [null, 'Sel. Yrs.', 'Clim.'],
                ['Ensemble Med. w/ Forecast', selected_seasons_general_stats[index]['Ensemble Med. w/ Forecast'], seasonal_general_stats[index]['Ensemble Med. w/ Forecast']],
                ['LTA', selected_seasons_general_stats[index]['LTA'], seasonal_general_stats[index]['LTA']],
                ['Ensemble Med. w Forecast/LTA Pct.', selected_seasons_general_stats[index]['Ensemble Med. w Forecast/LTA Pct.'], seasonal_general_stats[index]['Ensemble Med. w Forecast/LTA Pct.']],
                ['Ensemble Med. Pctl. w/ Forecast', selected_seasons_general_stats[index]['Ensemble Med. Pctl. w/ Forecast'], selected_seasons_general_stats[index]['Ensemble Med. Pctl. w/ Forecast']],
            ],
            "Probability at EoS": [
                [null, 'Sel. Yrs.', 'Clim.'],
                ['Above Normal', selected_seasons_general_stats[index]['Probability Above Normal w/ Forecast'], seasonal_general_stats[index]['Probability Above Normal w/ Forecast']],
                ['Normal', selected_seasons_general_stats[index]['Probability of Normal w/ Forecast'], seasonal_general_stats[index]['Probability of Normal w/ Forecast']],
                ['Below Normal', selected_seasons_general_stats[index]['Probability Below Normal w/ Forecast'], seasonal_general_stats[index]['Probability Below Normal w/ Forecast']],
            ]
        }
    };

    const table = new Table(containerElement, getAccumulationsCurrentTableData)
    return table;
}

function makeEnsembleWithForecastCard(containerElement) {
    return {
        "plot": makeEnsembleWithForecastPlot(containerElement),
        "table": makeEnsembleWithForecastTable(containerElement),
    }
}

function makeAccumulationPercentilesPlot(containerElement) {
    let xNames = [...datasetProperties['year_ids']];
    xNames.push(datasetProperties['current_season_id']);
    
    const xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
        'end_xs': [xNames.length - 1],
    };
    const xsDataRelation = {
        'Current Accumulation to Present': 'end_xs',
    };
    const plotTypes = {
        'Seasonal Accumulation': 'bar',
        'Current Accumulation to Present': 'bar',
        'Climatology Average': 'line',
        'D4: 3 Pctl.': 'line',
        'D3: 6 Pctl.': 'line',
        'D2: 11 Pctl.': 'line',
        'D1: 21 Pctl.': 'line',
        'D0: 31 Pctl.': 'line',
        '67 Pctl.': 'line',
    };
    const getAccumulationsCurrentPlotData = (index) => {
        const xLength = seasonal_current_totals[index].length + 1;
        return {
            'Seasonal Accumulation': seasonal_current_totals[index],
            'Current Accumulation to Present': [place_general_stats[index]['Current Accumulation to Present']],
            'Climatology Average': extendScalar(place_general_stats[index]['Climatology Average at Current Dekad'], xLength),
            '67 Pctl.': extendScalar(place_general_stats[index]['Seasonal 67 Pctl.'], xLength),
            '33 Pctl.': extendScalar(place_general_stats[index]['Seasonal 33 Pctl.'], xLength),
            'D1: 21 Pctl.': extendScalar(place_general_stats[index]['Seasonal 21 Pctl.'], xLength),
            'D2: 11 Pctl.': extendScalar(place_general_stats[index]['Seasonal 11 Pctl.'], xLength),
            'D3: 6 Pctl.': extendScalar(place_general_stats[index]['Seasonal 6 Pctl.'], xLength),
            'D4: 3 Pctl.': extendScalar(place_general_stats[index]['Seasonal 3 Pctl.'], xLength),
        }
    };
    const plot = new BBPlot(containerElement, getAccumulationsCurrentPlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes);
    return plot;
}

function makeAccumulationPercentilesTable(containerElement) {
    const getAccumulationsCurrentTableData = (index) => {
        return {
            "Historical Rainfall Statistics": [
                ['67 Percentile', place_general_stats[index]['Seasonal 67 Pctl.'], null],
                ['33 Percentile', place_general_stats[index]['Seasonal 33 Pctl.'], null],
                ['11 Percentile', place_general_stats[index]['Seasonal 11 Pctl.'], null],
            ],
            "Current Season Statistics": [
                ['Current Season Pctl.', place_general_stats[index]['Current Season Pctl.']],
            ]
        }
    };

    const table = new Table(containerElement, getAccumulationsCurrentTableData)
    return table;
}

function makeAccumulationPercentilesCard(containerElement) {
    return {
        "plot": makeAccumulationPercentilesPlot(containerElement),
        "table": makeAccumulationPercentilesTable(containerElement),
    }
}








function makePawsPlot(containerElement) {
    let xNames = [...pawsSeries[pawsFirstEntry]['date']];
    
    const xsDefinition = {
        'default_xs': ascendingArray(xNames.length),
    };
    const xsDataRelation = {
    };
    const plotTypes = {
    };
    const getPawsPlotData = (index) => {
        plot.xNames = pawsSeries[index]['date'];
        plot.xsDefinition = {
            'default_xs': ascendingArray(plot.xNames.length),
        };
        return {
            'chirp': pawsSeries[index]['chirp'],
            'chpclim1': pawsSeries[index]['chpclim1'],
            'imerg': pawsSeries[index]['imerg'],
            'rg1': pawsSeries[index]['rg1'],
            'rg2': pawsSeries[index]['rg2'],
        }
    };
    const plot = new BBPlot(containerElement, getPawsPlotData, xNames, 
        xsDefinition, xsDataRelation, plotTypes);
    return plot;
}

function makePawsTable(containerElement) {
    const getPawsTableData = (index) => {
        return {
            "Historical Rainfall Statistics": [
                ['', null, null],
            ],
        }
    };

    const table = new Table(containerElement, getPawsTableData)
    return table;
}

function makePawsCard(containerElement) {
    return {
        "plot": makePawsPlot(containerElement),
        // "table": makePawsTable(containerElement),
    }
}
