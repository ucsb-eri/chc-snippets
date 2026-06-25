// This file contains the classes and code to construct the widgets that
// contain the plots, maps, and other type of data

class BBPlot {
    constructor(containerElement, dataGetter, xNames, xsDefinition, 
        xsDataRelation, chartTypes, 
        gridLinesGetter = () => [], 
        customSettings = {}) {
        this.containerElement = containerElement;
        this.dataGetter = dataGetter;
        this.xNames = xNames;
        this.xsDefinition = xsDefinition;
        this.xsDataRelation = xsDataRelation;
        this.chartTypes = chartTypes;
        this.gridLinesGetter = gridLinesGetter;
        this.customSettings = customSettings;

        this.allContainer = this.containerElement.append("div")
            .attr("class", "plot-context-container");

        const chartContainer = this.allContainer.append("div")
            .attr("class", "plot-chart-container w3-container w3-padding-small");
        const legendContainer = this.allContainer.append("div")
            .attr("class", "plot-legend-container w3-container w3-padding-small");
        
        
        const chartOptions = {
            axis: { x: { tick: { format: (index) => { return this.xNames[index]; }, }, }, },
            tooltip: { format: { value: function (value, ratio, id) { return Math.round(value); }, }, },
            legend: {
                contents: {
                    bindto: legendContainer.node(),
                    template: (title, color, data) => getLegend(title, color, data, this.chartTypes),
                },
            },
            point: { show: true, },
            bar: {
                zerobased: false,
            },
            area: {
                zerobased: false,
            }
        };
        this.plot = bb.generate({
            bindto: chartContainer.node(),
            data: { json: {}, },
            ..._.merge(defaultOptions, chartOptions, this.customSettings)
        });
    }

    update(index) {
        const data = this.dataGetter(index);
        const dataIds = Object.keys(data);
        const xs = Object.fromEntries(dataIds.map(id => {
                return [id, (id in this.xsDataRelation) 
                    ? this.xsDataRelation[id] : "default_xs"];
            }));
        const jsonData = {
            ...this.xsDefinition,
            ...data,
        };
        this.plot.load({
            json: jsonData,
            xs: xs,
            types: this.chartTypes,
            colors: chartColors,
            unload: true,
        });
        this.plot.xgrids(this.gridLinesGetter(index));
    }

    resize(size) {
        this.plot.resize();
    }
}

class Table {
    constructor(containerElement, dataGetter) {
        this.containerElement = containerElement;
        this.dataGetter = dataGetter;

        this.tableContainer = this.containerElement
            .append("div")
            .attr("class", "chart-table-container w3-hide");
        this.tableCollection = null;
    }

    update(index) {
        const data = this.dataGetter(index);
        this.tableContainer.selectAll("table").remove();
        this.tableCollection = this.tableContainer
        .selectAll("table")
            .data(Object.keys(data))
            .join("table")
                .attr("class", "chart-table w3-table w3-bordered w3-border")
                .call(table => {
                    table.append("thead")
                    .append("th")
                    .classed("w3-hide", d => d === "[hide header]")
                    .attr("colspan", d => data[d][0].length)
                        .text(d => d);
            
                    table.append("tbody").selectAll("tr")
                        .data(d => data[d])
                        .join("tr").selectAll("td")
                            .data(d => d)
                            .join("td")
                                .call(td => {
                                    td.text((d) => {
                                            if (typeof d === 'number' && !isNaN(d)) {
                                                return d.toFixed(0);
                                            } else if (d === null) {
                                                return '';
                                            } else {
                                                return d;
                                            }
                                        });
                                })
            });
    }
}

class chartCard {
    constructor(containerSelector, defaultCardType) {
        this.cardTypes = {
            "Disabled": {
                "full title": "Disabled",
                "cardElementsBuilder": () => {},
            },
            "PAWS": {
                "full title": "PAWS Data",
                "cardElementsBuilder": makePawsCard,
            }, 
        };
        if (hasMap) {
            this.cardTypes["Map"] = {
                "full title": "Map",
                "cardElementsBuilder": makeMapCard,
            };
        }
        this.cardType = defaultCardType;

        this.elementContainer = d3.select(containerSelector);
        this.cardContainer = this.elementContainer
            .append("div")
            .attr("class", "plot-card");

        this.cardHeader = this.cardContainer
            .append("header")
            .attr("class", "card-header w3-blue-grey");
        this.cardButtonGroup = this.cardHeader.append("div")
            .attr("class", "card-button-group");
        this.graphTypeSelectContainer = this.cardHeader
            .append("div")
            .attr("class", "card-title-select w3-dropdown-click")
            .on("click.openDropDownMenu", (event) => {
                const graphTypeSelectContent = this.graphTypeSelectContent;
                graphTypeSelectContent
                    .classed("w3-show", !graphTypeSelectContent.classed("w3-show"));
            });
        this.graphTypeSelectOpenButton = this.graphTypeSelectContainer
            .append("span")
            .attr("class", "card-title-select-button")
            .text(this.cardTypes[this.cardType]["full title"]);
        this.graphTypeSelectContent = this.cardHeader
            .append("div")
            .attr("class", "w3-dropdown-content w3-bar-block w3-border");
        this.graphTypeSelectContent.selectAll("button").data(Object.keys(this.cardTypes))
            .join("button")
                .attr("class", "card-title-select-button w3-bar-item w3-button")
                .attr("value", d => d)
                .text(d => d)
            .on("click.selectCardType", (event) => {
                const graphTypeSelectContent = this.graphTypeSelectContent;
                graphTypeSelectContent.classed("w3-show", false);
                const selectedCardType = event.target.value;
                this.changePlot(selectedCardType);
            });

        this.cardBody = this.cardContainer
            .append("div")
            .attr("class", "card-body w3-container w3-padding-small");
        
        this.cardElements = this.cardTypes[this.cardType]["cardElementsBuilder"](this.cardBody);
        this.changePlot(defaultCardType);
    }

    changePlot(cardType) {
        this.cardType = cardType;
        this.graphTypeSelectOpenButton.text(this.cardTypes[this.cardType]["full title"]);
        this.cardBody.selectChildren().remove();

        
        this.cardButtonGroup.selectChildren().remove();
        this.closeButton = this.cardButtonGroup.append("span").append("button")
            .attr("class", "card-button card-edit-button mi w3-button w3-ripple w3-right capture-ignore")
            .attr("title", "Close Card")
            .text("close")
            .on("click", (event) => {
                grid.removeWidget(this.elementContainer.node().parentElement);
            });

        if (this.cardType == "Disabled") {
            this.cardElements = {}
            return;
        }

        this.cardElements = this.cardTypes[this.cardType]["cardElementsBuilder"](this.cardBody);

        if (this.cardElements["table"]) {
            this.toggleTableButton = this.cardButtonGroup.append("span").append("button")
                    .attr("class", "card-button mi w3-button w3-ripple w3-right capture-ignore")
                    .attr("title", "Toggle display table")
                    .text("table_chart")
                    .on("click", (event) => {
                        this.cardElements["table"].tableContainer.classed("w3-hide", !this.cardElements["table"].tableContainer.classed("w3-hide"));
                    });
        }
        if (this.cardElements["controlPanel"]) {
            this.openMapControlPanelButton = this.cardButtonGroup.append("span").append("button")
                    .attr("class", "card-button mi w3-button w3-ripple w3-right capture-ignore")
                    .attr("title", "Open Control Panel")
                    .text("settings")
                    .on("click", (event) => {
                        this.cardElements["controlPanel"].controlPanelContainer.classed("w3-hide", !this.cardElements["controlPanel"].controlPanelContainer.classed("w3-hide"));
                    });
        }

        // Fills data in the card
        this.update(currentDataIndex);
    }

    update(index) {
        for (const elementKey of Object.keys(this.cardElements)) {
            this.cardElements[elementKey].update(index);
        }
    }

    resize(size) {
        for (const elementKey of Object.keys(this.cardElements)) {
            this.cardElements[elementKey].resize(size);
        }
    }
}