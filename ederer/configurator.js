function EwxMapSnippetConfigurator(geoEngineUrl) {
  console.log(in EwxMapSnippetConfigurator...);

  this.datasetSelect = $('#dataset-select');
  this.regionSelect = $('#region-select');
  this.periodicitySelect = $('#periodicity-select');
  this.statisticSelect = $('#statistic-select');
  this.yearSelect = $('#year-select');
  this.temporal1Select = $('#temporal1-select');
  this.latestCheckbox = $('#latest-checkbox');
  this.yearNavigationCheckbox = $('#year-navigation-checkbox');
  this.temporal1Checkbox = $('#temporal1-navigation-checkbox');

  this.regionData = {
    "westernafrica": {
      "bounds": [
        [
          5.0,
          -17.25
        ],
        [
          18.0,
          25.25
        ]
      ],
      "regionName": "Western Africa",
      "regionId": "westernafrica"
    },
    "easternafrica": {
      "bounds": [
        [
          -12.0,
          21.75
        ],
        [
          23.25,
          51.25
        ]
      ],
      "regionName": "Eastern Africa",
      "regionId": "easternafrica"
    },
    "whem": {
      "bounds": [
        [
          -50.0,
          -130.0
        ],
        [
          50.0,
          -30.0
        ]
      ],
      "regionName": "Western Hemisphere",
      "regionId": "whem"
    },
    "southernafrica": {
      "bounds": [
        [
          -34.75,
          5.75
        ],
        [
          7.0,
          51.25
        ]
      ],
      "regionName": "Southern Africa",
      "regionId": "southernafrica"
    },
    "global": {
      "bounds": [
        [
          -90.0,
          -180.0
        ],
        [
          90.0,
          180.0
        ]
      ],
      "regionName": "Global",
      "regionId": "global"
    },
    "asia": {
      "bounds": [
        [
          5.0,
          40.0
        ],
        [
          57.0,
          147.0
        ]
      ],
      "regionName": "Asia",
      "regionId": "asia"
    },
    "africa": {
      "bounds": [
        [
          -40.0,
          -20.0
        ],
        [
          40.0,
          55.0
        ]
      ],
      "regionName": "Africa",
      "regionId": "africa"
    },
    "usa": {
      "bounds": [
        [
          23.0,
          -130.0
        ],
        [
          50.0,
          -63.0
        ]
      ],
      "regionName": "United States",
      "regionId": "usa"
    }
  };

  var _this = this;

  this.datasetSelect.change(function (e) {
    _this.setDataset($(e.target).val());
  });
  this.regionSelect.change(function (e) {
    _this.setRegion($(e.target).val());
  });
  this.periodicitySelect.change(function (e) {
    _this.setPeriodicity($(e.target).val());
  });
  this.statisticSelect.change(function (e) {
    _this.setStatistic($(e.target).val());
  });
  this.yearSelect.change(function (e) {
    _this.setYear($(e.target).val());
  });
  this.temporal1Select.change(function (e) {
    _this.setTemporal1($(e.target).val());
  });
  this.yearNavigationCheckbox.change(function (e) {
    _this.toggleShowYearNavigation($(e.target).prop('checked'));
  });
  this.temporal1Checkbox.change(function (e) {
    _this.toggleShowTemporal1Navigation($(e.target).prop('checked'));
  });
  this.latestCheckbox.change(function (e) {
    _this.toggleLatest($(e.target).prop('checked'));
  });

  $.ajax({
    url: geoEngineUrl + '/rest/config/ewx'
  }).done(function (response) {
    _this.datasets = response.datasets;
    _this.updateDatasets(_this.datasets);

    _this.setDataset('chirps');
    _this.setStatistic('data');
    _this.setPeriodicity('1-dekad');
    _this.setYear(_this.getEnd().year);
    _this.setTemporal1(_this.getEnd().dekad);

    var period = {
      year: _this.currentYear
    };
    if (_this.currentPeriodicityId === '1-month' || _this.currentPeriodicityId === '2-month' || _this.currentPeriodicityId === '3-month') {
      period.month = _this.currentTemporal1;
    } else if (_this.currentPeriodicityId === '1-dekad') {
      var monthAndDekad = _this.dekadToMonthAndDekad(Number(_this.currentTemporal1));
      period.month = monthAndDekad.month;
      period.dekad = monthAndDekad.dekad;
    }

    var generatedId = 'ewx-map-' + Math.random().toString(36).substr(2, 10);
    $('#map-view').append($('<div id="' + generatedId + '"></div>'));

    _this.ewxMap = new EwxMap({
      ewxUrl: 'http://ewx3.chg.ucsb.edu/ewx/', //mfl
      id: generatedId,
      dataset: _this.currentDatasetId,
      region: _this.currentRegionId,
      periodicity: _this.currentPeriodicityId,
      period: period,
      showDekadControl: true,
      showYearControl: true,
      units: _this.getUnits(),
      statistic: _this.currentStatisticId,
      width: 427,
      height: 455,
      zoom: 3,
      center: [1.5, 17],
      loadImmediately: true,
      _makeTimeControlsUnresponsive: true
    });
    _this.ewxMap.addReadyListener(_this.mapReady);

    _this.generateCode();
    _this.setUpMapEvents();
  });
  
  this.mapReady = function() {
    $('#map-form-controls').css('display', 'block');
  };

  this.setUpMapEvents = function() {
    var _this = this;
    window.setTimeout(function() {
      if(_this.ewxMap.map) {
        _this.ewxMap.map.on('zoomend', function (e) {
          _this.setZoom(_this.ewxMap.map.getZoom());
        });
        _this.ewxMap.map.on('move', function (e) {
          var center = _this.ewxMap.map.getCenter();
          _this.setCenter([(center.lat).toFixed(2), (center.lng).toFixed(2)]);
        });
        $('#' + _this.ewxMap.config.id).parent().resizable({
          resize: function(event) {
            var rootDiv = $('#' + _this.ewxMap.config.id);
            var newRootWidth = (parseInt(rootDiv.parent().css('width'))) + 'px';
            var newRootHeight = (parseInt(rootDiv.parent().css('height')) - 24) + 'px'
            rootDiv.css('width', newRootWidth);
            rootDiv.css('height', newRootHeight);

            _this.ewxMap.config.width = parseInt(newRootWidth);
            _this.ewxMap.config.height = parseInt(newRootHeight);

            _this.generateCode();
            setTimeout(function(){ _this.ewxMap.map.invalidateSize()}, 400);
          }
        });
      } else {
        _this.setUpMapEvents();
      }
    }, 300);
  };

  this.generateCode = function () {
    this.codeProperties = [
      'ewxUrl',
      'id',
      'dataset',
      'region',
      'periodicity',
      'period',
      'showMonthControl',
      'showDekadControl',
      'showYearControl',
      'units',
      'statistic',
      'width',
      'height',
      'zoom',
      'center'
    ];
    this.codePropertyTypes = {
      ewxUrl: 'string',
      id: 'string',
      dataset: 'string',
      region: 'string',
      periodicity: 'string',
      period: 'special',
      showMonthControl: 'number',
      showDekadControl: 'number',
      showYearControl: 'number',
      units: 'string',
      statistic: 'string',
      width: 'number',
      height: 'number',
      zoom: 'number',
      center: 'special'
    };

    if(!this.ewxMap) {
      return;
    }

    var codeTableTbody = $('#code-view').first('table tbody');
    codeTableTbody.find('tr').remove();

    var lineNumber = 0;

    var randomId = 'ewx-map-' + Math.random().toString(36).substr(2, 10);

    codeTableTbody.append($('<tr><td class="code-view-code-cell">&lt;div id="' + randomId + '"&gt;&lt;/div&gt;</td></tr>'));
    codeTableTbody.append($('<tr><td class="code-view-code-cell">&lt;script&gt;</td></tr>'));
    codeTableTbody.append($('<tr><td class="code-view-code-cell">new EwxMap({</td></tr>'));

    for(var i = 0; i < this.codeProperties.length; i++) {
      var propertyName = this.codeProperties[i];
      var propertyValue = this.ewxMap.config[propertyName];
      if(propertyName === 'period') {
        if(this.latest) {
          propertyValue = 'latest';
        }
        if(propertyValue === 'latest') {
          propertyValue = "'latest'";
        } else {
          var monthValue;
          var dekadValue;
          if(this.currentPeriodicityId === '1-dekad') {
            var dekadAndMonth = this.dekadToMonthAndDekad(this.currentTemporal1);
            monthValue = dekadAndMonth.month;
            dekadValue = dekadAndMonth.dekad;
          } else {
            monthValue = this.currentTemporal1;
          }
          propertyValue = '{ <span class="code-property">year</span>: <span class="code-number-property-value">' + propertyValue.year + '</span>, <span class="code-property">month</span>: <span class="code-number-property-value">' + monthValue + '</span>'
            + (dekadValue ? ', <span class="code-property">dekad</span>: <span class="code-number-property-value">' + dekadValue + '</span>' : '') + ' }';
        }
      } else if(propertyName === 'id') {
        propertyValue = "'<span class='code-string-property-value'>" + randomId + "</span>'";
      } else if(propertyName === 'center') {
        propertyValue = '[<span class="code-number-property-value">' + propertyValue[0] + '</span>, <span class="code-number-property-value">' + propertyValue[1] + '</span>]';
      } else if(propertyName === 'showMonthControl') {
        if(this.currentPeriodicityId === '1-dekad') {
          continue;
        } else {
          propertyValue = '<span class="code-number-property-value">' + propertyValue + '</span>';
        }
      } else if(propertyName === 'showDekadControl') {
        if(this.currentPeriodicityId === '1-month' || this.currentPeriodicityId === '2-month' || this.currentPeriodicityId === '3-month') {
          continue;
        } else {
          propertyValue = '<span class="code-number-property-value">' + propertyValue + '</span>';
        }
      } else {
        if(this.codePropertyTypes[propertyName] === 'string') {
          propertyValue = "'<span class='code-string-property-value'>" + propertyValue + "</span>'";
        } else {
          propertyValue = '<span class="code-number-property-value">' + propertyValue + '</span>';
        }
      }

      lineNumber++;
      codeTableTbody.append($('<tr><td class="code-view-code-cell">&nbsp;&nbsp;<span class="code-property">' + propertyName + '</span>: ' + propertyValue + ',</td></tr>'));
    }

    codeTableTbody.append($('<tr><td class="code-view-code-cell">});</td></tr>'));
    codeTableTbody.append($('<tr><td class="code-view-code-cell">&lt;/script&gt;</td></tr>'));
  };

  this.dekadToMonthAndDekad = function (dekad) {
    var m = Math.floor((dekad - 1) / 3) + 1;
    var d = dekad - ((m - 1) * 3);

    return {month: m, dekad: d};
  };

  this.updateDatasets = function (datasets) {
    this.datasetSelect.find('option').remove();
    var datasetIds = Object.keys(datasets).sort();
    $.each(datasetIds, function (i, datasetId) {
      var dataset = datasets[datasetId];
      if (Object.keys(dataset.regions).length) {
        _this.datasetSelect.append($("<option />").val(datasetId).text(dataset.shortName));
      }
    });

    this.setDataset(datasetIds[0]);
  };

  this.setDataset = function (datasetId) {
    this.datasetSelect.val(datasetId);
    this.currentDatasetId = datasetId;
    this.updateRegions(this.datasets[datasetId].regions);
  };

  this.updateRegions = function (regions) {
    this.regionSelect.find('option').remove();
    var regionIds = Object.keys(regions).sort();
    $.each(regionIds, function (i, regionId) {
      var region = regions[regionId];
      _this.regionSelect.append($("<option />").val(regionId).text(region.name));
    });

    var updatedListContainsPreviousValue = regionIds.indexOf(this.currentRegionId) > -1;
    this.setRegion(updatedListContainsPreviousValue ? this.currentRegionId : regionIds[0], updatedListContainsPreviousValue);
  };

  this.setRegion = function (regionId, skipBoundsAdjustment) {
    this.regionSelect.val(regionId);
    this.currentRegionId = regionId;

    if(!skipBoundsAdjustment && this.ewxMap && this.ewxMap.map) {
      try {
        this.ewxMap.map.fitBounds(this.regionData[regionId].bounds);
      } catch(ex) {
        console.log("No bounds data for region: " + regionId);
      }
    }

    this.updatePeriodicities(this.datasets[this.currentDatasetId].regions[regionId].periodicities);
  };

  this.updatePeriodicities = function (periodicities) {
    this.periodicitySelect.find('option').remove();
    var periodicityIds = Object.keys(periodicities).sort();
    $.each(periodicityIds, function (i, periodicityId) {
      var periodicity = periodicities[periodicityId];
      _this.periodicitySelect.append($("<option />").val(periodicityId).text(periodicityId));
    });

    this.setPeriodicity(periodicityIds.indexOf(this.currentPeriodicityId) > -1 ? this.currentPeriodicityId : periodicityIds[0]);
  };

  this.setPeriodicity = function (periodicityId) {
    this.periodicitySelect.val(periodicityId);
    this.currentPeriodicityId = periodicityId;
    var periodicityCanonicalName = periodicityId.replace(/^\d-/, '');
    periodicityCanonicalName = periodicityCanonicalName.charAt(0).toUpperCase() + periodicityCanonicalName.slice(1);
    this.temporal1Select.prev().first('label').text(periodicityCanonicalName);
    this.temporal1Checkbox.next().text(periodicityCanonicalName);
    this.updateStatistics(this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[periodicityId]);
  };

  this.updateStatistics = function (statistics) {
    this.statisticSelect.find('option').remove();
    var statisticIds = Object.keys(statistics).sort();
    $.each(statisticIds, function (i, statisticId) {
      var statistic = statistics[statisticId];
      if (statisticId !== 'stm') {
        _this.statisticSelect.append($("<option />").val(statisticId).text(statisticId));
      }
    });

    this.setStatistic(statisticIds.indexOf(this.currentStatisticId) > -1 ? this.currentStatisticId : statisticIds[0]);
  };

  this.setStatistic = function (statisticId) {
    this.statisticSelect.val(statisticId);
    this.currentStatisticId = statisticId;
    this.updateYear();
  };

  this.updateYear = function () {
    var statistic = this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[this.currentPeriodicityId][this.currentStatisticId];
    var startYear = statistic.start.year;
    var endYear = statistic.end.year;

    this.yearSelect.find('option').remove();
    var years = [];
    for (var year = startYear; year <= endYear; year++) {
      this.yearSelect.append($("<option />").val(year).text(year));
      years.push(String(year));
    }

    if(this.latest) {
      this.setYear(this.getEnd().year);
    } else {
      this.setYear(years.indexOf(String(this.currentYear)) > -1 ? this.currentYear : years[0], true);
    }
  };

  this.setYear = function (year) {
    this.yearSelect.val(year);
    this.currentYear = year;
    this.updateTemporal1();
  };

  this.updateTemporal1 = function () {
    var statistic = this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[this.currentPeriodicityId][this.currentStatisticId];
    var startYear = statistic.start.year;
    var endYear = statistic.end.year;
    var startTemporal1;
    var endTemporal1;
    var numPeriods;
    switch (this.currentPeriodicityId) {
      case '1-dekad':
        startTemporal1 = statistic.start.dekad;
        endTemporal1 = statistic.end.dekad;
        numPeriods = 36;
        break;
      case '1-month':
      case '2-month':
      case '3-month':
        startTemporal1 = statistic.start.month;
        endTemporal1 = statistic.end.month;
        numPeriods = 12;
        break;
      case '1-pentad':
        startTemporal1 = statistic.start.pentad;
        endTemporal1 = statistic.end.pentad;
        numPeriods = 72;
        break;
    }

    this.temporal1Select.find('option').remove();
    var temporal1s = [];
    for (var temporal1 = 1; temporal1 <= numPeriods; temporal1++) {
      if (this.currentYear == startYear && temporal1 < startTemporal1) {
        continue;
      }
      if (this.currentYear == endYear && temporal1 > endTemporal1) {
        break;
      }

      this.temporal1Select.append($("<option />").val(temporal1).text(temporal1));
      temporal1s.push(String(temporal1));
    }

    if(this.latest) {
      if(this.currentPeriodicityId === '1-dekad') {
        this.setTemporal1(this.getEnd().dekad);
      } else {
        this.setTemporal1(this.getEnd().month);
      }
    } else {
      this.setTemporal1(temporal1s.indexOf(String(this.currentTemporal1)) > -1 ? this.currentTemporal1 : temporal1s[0]);
    }
  };

  this.setTemporal1 = function (temporal1, doNotUpdateRaster) {
    this.temporal1Select.val(temporal1);
    this.currentTemporal1 = temporal1;

    if (!doNotUpdateRaster) {
      this._updateRaster();
    }
    this.generateCode();
    if(this.ewxMap) {
      this.ewxMap.createLegend();
    }
  };

  this._updateRaster = function () {
    if (this.ewxMap) {
      this.ewxMap.updateRasterLayer({
        dataset: this.currentDatasetId,
        region: this.currentRegionId,
        periodicity: this.currentPeriodicityId,
        temporal1: this.currentTemporal1,
        year: this.currentYear,
        units: this.getUnits(),
        statistic: this.currentStatisticId
      });
    }
  };

  this.getUnits = function () {
    return this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[this.currentPeriodicityId][this.currentStatisticId].units;
  };

  this.getStart = function () {
    return this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[this.currentPeriodicityId][this.currentStatisticId].start;
  };

  this.getEnd = function () {
    return this.datasets[this.currentDatasetId].regions[this.currentRegionId].periodicities[this.currentPeriodicityId][this.currentStatisticId].end;
  };

  this.toggleLatest = function (checked) {
    this.latest = checked;
    if(checked) {
      this.yearSelect.prop('disabled', true);
      this.temporal1Select.prop('disabled', true);

      this.setYear(this.getEnd().year);
      if(this.currentPeriodicityId === '1-dekad') {
        this.setTemporal1(this.getEnd().dekad);
      } else {
        this.setTemporal1(this.getEnd().month);
      }
    } else {
      this.yearSelect.prop('disabled', false);
      this.temporal1Select.prop('disabled', false);
      this.generateCode();
    }
  };

  this.toggleShowYearNavigation = function (checked) {
    if (checked) {
      this.ewxMap.showYearNavigation();
    } else {
      this.ewxMap.hideYearNavigation();
    }
    this.generateCode();
  };

  this.toggleShowTemporal1Navigation = function (checked) {
    if (checked) {
      this.ewxMap.showTemporal1Navigation();
    } else {
      this.ewxMap.hideTemporal1Navigation();
    }
    this.generateCode();
  };

  this.setZoom = function(level) {
    this.ewxMap.config.zoom = level;
    this.generateCode();
  };

  this.setCenter = function(center) {
    this.ewxMap.config.center = center;
    this.generateCode();
  };
}

new EwxMapSnippetConfigurator('/configurator.html'); //mfl
