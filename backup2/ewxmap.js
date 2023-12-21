var EwxMap = function (configuration) {
  this.config = configuration;
  console.log('this.config: ', this.config);

  this.config.period = this.config.period ? this.config.period : 'latest';
  var latest = this.config.period == 'latest';
  if (typeof this.config.title === 'undefined') {
    this.config.title = true;
  }
  if (!this.config.legendPosition) {
    this.config.legendPosition = 'lower-right';
  }

  if (this.config.periodicity === '1-dekad') {
console.log('this.config.period.dekad: ', this.config.period.dekad);
    this.config.period.temporal1 = padDateNumber(((this.config.period.month - 1) * 3) + this.config.period.dekad);
  } else if (this.config.periodicity === '1-month' || this.config.periodicity === '2-month' || this.config.periodicity === '3-month') {
    this.config.period.temporal1 = padDateNumber(this.config.period.month);
  } else if (this.config.periodicity === '1-pentad') {
    this.config.period.temporal1 = padDateNumber(((this.config.period.month - 1) * 6) + this.config.period.pentad);
  } else if (this.config.periodicity === '1-day') {
    this.config.period.temporal1 = padDateNumber(this.config.period.day);
  }

  var baseUrl;
  var geoengineUrl;
  var geoserverUrl;
  var ewxUrlPath;
  var dataItemName;
  var datePart;

  this.readyListeners = [];

  /**
   * Kicks off the application.  Loads jQuery if it is not already loaded by the
   * page in which this snippet is embedded.  Adds a load event listener to window
   * that will execute the next callback (loadAssets).
   */
  this.init = function () {
    // Make sure jQuery is loaded
    var _this = this;
    if (this.config.loadImmediately) {
      this._load();
    } else {
      window.addEventListener('load', function () {
        _this._load();
      });
    }
  };

  this._load = function () {
    var _this = this;
    if (window.jQuery === undefined) {
      _this.loadScript('http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js', _this.loadAssets, _this.loadTempralConfigData);
    } else {
      _this.loadAssets(_this.loadTempralConfigData);
    }
  };

  /**
   * Loads OpenLayers and application css files.  Loads OpenLayers javascript file
   * if not already loaded.
   *
   * @param done The next callback to execute (this.loadEwxConfig)
   */
  this.loadAssets = function (done) {
    var _this = this;

    $(function () {
      if (!window.MAP_STYLES_LOADING && !window.MAP_STYLES_LOADED) {
        window.MAP_STYLES_LOADING = true;
        $("<link/>", {
          rel: "stylesheet",
          type: "text/css",
          href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.css"
        }).appendTo("head");

        $("<link/>", {
          rel: "stylesheet",
          type: "text/css",
          href: "http://m03.chc.ucsb.edu/ewxmap/styles.css"
          // href: "styles.css"
        }).appendTo("head");

        window.MAP_STYLES_LOADED = true;
      }

      if (window.L === undefined) {
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.js").done(function () {
          if (done) done.call(_this, _this.loadEwxConfig);
        });
      } else {
        if (done) done.call(_this, _this.loadEwxConfig);
      }
    });
  };

  this.loadTempralConfigData = function (done) {
console.log('start downloading temporal config...');
var currentdate = new Date();
var datetime = currentdate.getMinutes() + ":" + currentdate.getSeconds();
console.log('datetime: ', datetime);
    var _this = this;

    if (this.config.showTimeNav || this.config.showYearControl || this.config.showDekadControl || this.config.showMonthControl) {
      baseUrl = this.config.ewxUrl;
      var a = $('<a>', {href: baseUrl})[0];
      baseUrl = a.protocol + '//' + a.hostname + ':' + a.port;
      ewxUrlPath = a.pathname;
      console.log('ewxUrlPath: ', ewxUrlPath);

      geoserverUrl = a.protocol + "//" + a.hostname + ":8443";
      geoengineUrl = a.protocol + "//" + a.hostname + ":8919";
      var temporalConfigUrl = geoengineUrl + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region + '/periodicity/' + _this.config.periodicity + '/statistic/' + _this.config.statistic + '?listCoverages=true';
console.log('temporalConfigURL: ', temporalConfigUrl);
      $.ajax({
        url: temporalConfigUrl,
        crossDomain: true,
        jsonp: 'callback',
        dataType: 'jsonp'
      }).done(function (data) {
console.log('done downloading temporal config');
var currentdate = new Date();
var datetime = currentdate.getMinutes() + ":" + currentdate.getSeconds();
console.log('datetime: ', datetime);
console.log('temporal data: ', data);
        _this.temporalControlsConfig = [];
        $.each(data.data.regions[0].periodicities[0].statistics[0].periodicCoverages, function (i, coverage) {
          _this.temporalControlsConfig.push(coverage.name);
        });
        _this.timeNavigator = new TimeNavigator(_this.temporalControlsConfig);

        if (done) done.call(_this, _this.calculateDataItemName);
      });
    } else {
      if (done) done.call(_this, _this.calculateDataItemName);
    }
  };

  /**
   * Loads the EWX config JSON from the EWX server.  Executes the next
   * callback (calculateDataItemName).
   *
   * @param done The next callback to execute (calculateDataItemName)
   */
  this.loadEwxConfig = function (done) {
    baseUrl = this.config.ewxUrl;
    var a = $('<a>', {href: baseUrl})[0];
    baseUrl = a.protocol + '//' + a.hostname + ':' + a.port;
    ewxUrlPath = a.pathname;

    geoserverUrl = a.protocol + "//" + a.hostname + ":8443";
    geoengineUrl = a.protocol + "//" + a.hostname + ":8919";

    var _this = this;

    console.log('In loadEwxconfig, : ', _this.config.period.dekad);
    datePart = '01-2020';
   var myurl =  geoengineUrl + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region + '/periodicity/' + _this.config.periodicity + '/statistic/' + _this.config.statistic     + '/latest'
    console.log('congif url: ', myurl);
    console.log('starting downloading config...');
    if (this.config.period == 'latest') {
      $.ajax(
        {
          url: geoengineUrl + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region + '/periodicity/' + _this.config.periodicity + '/statistic/' + _this.config.statistic + '/latest',
          crossDomain: true,
          jsonp: "callback",
          dataType: "jsonp"
        }).done(function (data) {
          console.log('done downloading config...');
          console.log('config data: ', data);

        dataItemName = data.data.regions[0].periodicities[0].statistics[0].periodicCoverages[0].name;
        _this.config.period = data.data.regions[0].periodicities[0].statistics[0].end;
        if (_this.config.periodicity === '1-dekad') {
          console.log('In latest, if periodiciy === 1-dekad: ', _this.config.period.dekad);
          _this.config.temporal1 = _this.config.period.dekad;
          _this.config.period.temporal1 = _this.config.period.dekad;
        } else if (_this.config.periodicity === '1-day') {
          _this.config.temporal1 = _this.config.period.day;
          _this.config.period.temporal1 = _this.config.period.day;
        } else if (_this.config.periodicity === '1-pentad') {
	  _this.config.temporal1 = _this.config.period.period;
	  _this.config.period.temporal1 = _this.config.period.pentad;
	} else {
          _this.config.temporal1 = _this.config.period.month;
          _this.config.period.temporal1 = _this.config.period.month;
        }
        _this.createMap.call(_this, _this.createLegend);
      }).fail(function (err) {
        console.log("Error: " + err);
      });
    } else {
      if (_this.config.periodicity === '1-dekad') {
        _this.config.temporal1 = _this.config.period.dekad;
      } else if (_this.config.periodicity === '1-day') {
        _this.config.temporal1 = _this.config.period.day;
      } else if (_this.config.periodicity === '1-pentad') {
	_this.config.temporal1 = _this.config.period.pentad;
      } else {
        _this.config.temporal1 = _this.config.period.month;
      } 
      
      if (done) done.call(_this, _this.createMap);
    }
  };

  /**
   * Calculates the GeoServer layer name from config parameters.
   *
   * @param done
   */
  this.calculateDataItemName = function (done) {
    if (this.config.periodicity == '1-month'
      || this.config.periodicity == '2-month'
      || this.config.periodicity == '3-month') {
      var month = padDateNumber(this.config.period.month);
      datePart += month + '-' + this.config.period.year;
    } else if (this.config.periodicity == '1-dekad') {
      var dekad;
      if (latest) {
        dekad = padDateNumber(this.config.period.dekad);
      } else {
        dekad = padDateNumber(((this.config.period.month - 1) * 3) + this.config.period.dekad);
      }
      datePart = dekad + '-' + this.config.period.year;
    } else if (this.config.periodicity == '1-pentad') {
      var pentad = padDateNumber(((this.config.period.month - 1) * 6) + this.config.period.pentad);
      datePart = pentad + '-' + this.config.period.year;
    } else if (this.config.periodicity == '1-day') {
      var day = padDateNumber(this.config.period.day);
      datePart = day + '-' + this.config.period.year;
    } //check to see if day is working

    dataItemName = this.config.dataset + '_' + this.config.region + '_' + this.config.periodicity + '-' +
      datePart + '_' + this.config.units + '_' + this.config.statistic;

    //createMap();
    if (done) done.call(this, this.createLegend);
  };

  this.createMap = function (done) {
console.log('creating map...');
    var rootNode = $('#' + this.config.id);
    var title = this.calculateTitle();
    if (title) {
      var outerDiv = $('<div class="map-container"></div>').css('width', (this.config.width) + 'px').css('height', (this.config.height + 24) + 'px');
      rootNode.after(outerDiv);
      this.titleDiv = $('<div class="ewx-map-titlebar">' + title + '</div>');
      outerDiv.append(this.titleDiv);
      outerDiv.append(rootNode);
    }

    if (this.config.width) {
      rootNode.css('width', this.config.width + 'px');
    }
    if (this.config.height) {
      rootNode.css('height', this.config.height + 'px');
    }

    rootNode.css('border-left', '1px solid gray');
    rootNode.css('border-right', '1px solid gray');
    rootNode.css('border-bottom', '1px solid gray');

    var map = L.map(this.config.id, {
      center: this.config.center,
      zoom: this.config.zoom,
      attributionControl: false
    });
    this.map = map;

    var mapLayer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: this.config.dataset + ":" + dataItemName,
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    mapLayer.addTo(map);
    this.currentMapLayer = mapLayer;

    var g20080Layer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: "global:g2008_1",
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    g20080Layer.addTo(map);
    this.g20080Layer = g20080Layer;

    var g20081Layer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: "global:g2008_0",
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    g20081Layer.addTo(map);
    this.g20081Layer = g20081Layer;

    var _this = this;

    map.on('click', function (evt) {
      if (_this.mouseWasMovingOverControl) {
        _this.mouseWasMovingOverControl = false;
        return;
      }

      var bounds = map.getBounds();
      var urLon = bounds._northEast.lng;
      var urLat = bounds._northEast.lat;
      var llLon = bounds._southWest.lng;
      var llLat = bounds._southWest.lat;
      var boundsString = llLon + ',' + llLat + ',' + urLon + ',' + urLat;
      var mapWidth = map.getSize().x;
      var mapHeight = map.getSize().y;
      // console.log(boundsString + ' ' + mapWidth + 'x' + mapHeight);
      // console.log("&X=" + evt.containerPoint.x + "&Y=" + evt.containerPoint.y);

      // mfl ewx_africa region used in reqURL
      var reqUrl = baseUrl + "/geoserver/wms?REQUEST=GetFeatureInfo" +
        "&EXCEPTIONS=application%2Fvnd.ogc.se_xml" +
        "&BBOX=" + boundsString +
        "&X=" + Math.round(evt.containerPoint.x) + "&Y=" + Math.round(evt.containerPoint.y) +
        "&INFO_FORMAT=text%2Fplain&QUERY_LAYERS=africa%3Ag2008_1" +
        "&FEATURE_COUNT=50&Styles=" +
        "&Layers=africa%3Ag2008_1" +
        "&Srs=EPSG%3A4326&WIDTH=" + mapWidth + "&HEIGHT=" + mapHeight + "&format=image%2Fpng";

      $.ajax({
        url: reqUrl,
        crossDomain: false,
        jsonp: "callback"
      }).done(function (text) {
        console.log("Received config data.");
        console.log(text);

        //- Parse the response
        if (!text.match(/Results for FeatureType/)) {
          return;
        }
        text = text.replace(/Results for FeatureType '([a-zA-Z0-9_\-:]+)':\n/m, '').replace(/^\-+\n/gm, '');

        var pairs = text.split(/\n/);
        var features = {};
        var featureName;
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i];

          if (pair.match(/^$/)) {
            continue;
          }

          var bits = pair.split(/\s*=\s*/);
          var name = bits[0];
          var value = bits[1];
          //console.log('features[' + name + '] = ' + value);
          features[name] = value;
        }

        var fewsId = features['FEWS_ID'];
        var fewsIdBits = fewsId.split(/\+/);
        var countryName = fewsIdBits[0];
        //console.log('countryName: ' + countryName + ' ' + fewsIdBits);
        var seasonStart = features['SEAS_START'];
        if (!seasonStart) {
          seasonStart = 1;
        }

        if (_this.config.timeSeries) {
          var currentYear = new Date().getFullYear();
          var seasonYears = [];
          seasonYears.push('stm');
          if (seasonStart == 1) {
            seasonYears.push(currentYear);
            seasonYears.push(currentYear - 1);
          } else {
            seasonYears.push((currentYear - 1) + '-' + currentYear);
            seasonYears.push((currentYear - 2) + '-' + (currentYear - 1));
          }
          var seasonsString = seasonYears.reverse().join(',');

          _this.config.timeSeries.update(fewsId, seasonsString);
        }
console.log('done parsing...');
      }).fail(function (err) {
        console.log("Error: " + err);
      });
    });

    if (this.config.showTimeNav || this.config.showYearControl || this.config.showDekadControl || this.config.showMonthControl) {
      this.timeBar = $('<div class="time-nav-bar"></div>');

      this.yearBackButton = $('<a class="previous-year-button" title="Previous year">&#171;</a>');
      this.yearBackButton.on('click', $.proxy(this.changeTemporalIndex, this));
      this.yearForwardButton = $('<a class="next-year-button" title="Next year">&#187;</a>');
      this.yearForwardButton.on('click', $.proxy(this.changeTemporalIndex, this));
      this.timeBar.append(this.yearBackButton);
      this.timeBar.append(this.yearForwardButton);

      this.temporal1BackButton = $('<a class="previous-temporal1-button" title="Previous ' + this.config.periodicity.replace(/^\d-/, '') + '">&#8249;</a>');
      this.temporal1BackButton.on('click', $.proxy(this.changeTemporalIndex, this));
      this.temporal1ForwardButton = $('<a class="next-temporal1-button" title="Next ' + this.config.periodicity.replace(/^\d-/, '') + '">&#8250;</a>');
      this.temporal1ForwardButton.on('click', $.proxy(this.changeTemporalIndex, this));
      this.yearBackButton.after(this.temporal1BackButton);
      this.temporal1BackButton.after(this.temporal1ForwardButton);

      if (this.config.showTimeNav || this.config.showYearControl) {
        this.showYearNavigation();
      }

      if (this.config.showDekadControl || this.config.showMonthControl) {
        this.showTemporal1Navigation();
      }

      this.timeBar.children('a').each(function (i) {
        $(this).mousemove(function (evt) {
          evt.stopImmediatePropagation(_this.mouseWasMovingOverControl = true)
        });
        $(this).dblclick(function (evt) {
          evt.stopImmediatePropagation(_this.mouseWasMovingOverControl = true)
        });
      });

      rootNode.append(this.timeBar);
    }

    $.each(this.readyListeners, function (i, readyListener) {
      readyListener();
    });

    if (done) done.call(this);
  };

  this.addReadyListener = function (listener) {
    this.readyListeners.push(listener);
  };

  this.showYearNavigation = function () {
    this.yearBackButton.css('display', 'block');
    this.yearForwardButton.css('display', 'block');
    if (this.temporal1BackButton.css('display') === 'block') {
      this.timeBar.css('width', '104px');
    } else {
      this.timeBar.css('width', '52px');
    }

    this.temporal1BackButton.css('border-top-left-radius', '0');
    this.temporal1BackButton.css('border-bottom-left-radius', '0');
    this.temporal1ForwardButton.css('border-top-right-radius', '0');
    this.temporal1ForwardButton.css('border-bottom-right-radius', '0');

    this.timeBar.css('display', 'block');

    this.config.showYearControl = true;
  };

  this.hideYearNavigation = function () {
    if (this.temporal1BackButton.css('display') === 'none') {
      this.timeBar.css('display', 'none');
    } else {
      this.temporal1BackButton.css('border-top-left-radius', '4px');
      this.temporal1BackButton.css('border-bottom-left-radius', '4px');
      this.temporal1ForwardButton.css('border-top-right-radius', '4px');
      this.temporal1ForwardButton.css('border-bottom-right-radius', '4px');
    }
    this.yearBackButton.css('display', 'none');
    this.yearForwardButton.css('display', 'none');
    this.timeBar.css('width', '52px');

    this.config.showYearControl = false;
  };

  this.showTemporal1Navigation = function () {
    this.temporal1BackButton.css('display', 'block');
    this.temporal1ForwardButton.css('display', 'block');
    if (this.yearBackButton.css('display') === 'block') {
      this.timeBar.css('width', '104px');
    } else {
      this.timeBar.css('width', '52px');

      this.temporal1BackButton.css('border-top-left-radius', '4px');
      this.temporal1BackButton.css('border-bottom-left-radius', '4px');
      this.temporal1ForwardButton.css('border-top-right-radius', '4px');
      this.temporal1ForwardButton.css('border-bottom-right-radius', '4px');
    }
    this.timeBar.css('display', 'block');

    this.config.showDekadControl = true;
    this.config.showMonthControl = true;
  };

  this.hideTemporal1Navigation = function () {
    if (this.yearBackButton.css('display') === 'none') {
      this.timeBar.css('display', 'none');
    }
    this.temporal1BackButton.css('display', 'none');
    this.temporal1ForwardButton.css('display', 'none');
    this.timeBar.css('width', '52px');

    this.config.showDekadControl = false;
    this.config.showMonthControl = false;
  };

  this.changeTemporalIndex = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.config._makeTimeControlsUnresponsive) {
      return;
    }

    var nextGeoServerName;
    if ($(evt.target).hasClass('previous-year-button')) {
      nextGeoServerName = this.timeNavigator.getPreviousYearGeoServerName(dataItemName);
    } else if ($(evt.target).hasClass('next-year-button')) {
      nextGeoServerName = this.timeNavigator.getNextYearGeoServerName(dataItemName);
    } else if ($(evt.target).hasClass('previous-temporal1-button')) {
      nextGeoServerName = this.timeNavigator.getPreviousTemporal1GeoServerName(dataItemName);
    } else if ($(evt.target).hasClass('next-temporal1-button')) {
      nextGeoServerName = this.timeNavigator.getNextTemporal1GeoServerName(dataItemName);
    }

    if (!nextGeoServerName) {
      return;
    }

    dataItemName = nextGeoServerName;

    var tokens = this.timeNavigator.tokenizeGeoServerName(dataItemName);
    this.config.period.year = Number(tokens.year);
    this.config.period.temporal1 = Number(tokens.temporal1);

    this.currentMapLayer.setParams({
      layers: this.config.dataset + ":" + dataItemName
    });

    if (this.titleDiv) {
      this.titleDiv.text(this.calculateTitle());
    }
  };

  this.updateRasterLayer = function (tokens) {
    var geoServerName = this.timeNavigator.assembleGeoServerName(tokens);

    dataItemName = geoServerName;

    this.config.period.year = Number(tokens.year);
    this.config.period.temporal1 = Number(tokens.temporal1);
    this.config.dataset = tokens.dataset;
    this.config.region = tokens.region;
    this.config.periodicity = tokens.periodicity;
    this.config.statistic = tokens.statistic;
    this.config.units = tokens.units;

    this.currentMapLayer.setParams({
      layers: this.config.dataset + ":" + dataItemName
    });

    if (this.titleDiv) {
      this.titleDiv.text(this.calculateTitle());
    }
  };

  this.createLegend = function () {
    var _this = this;


    _this.calculateDataItemName;
    var dataItemName = this.config.dataset + ':' + this.config.dataset + '_' + this.config.region + '_' + this.config.periodicity + '-' +
      datePart + '_' + this.config.units + '_' + this.config.statistic;
    // mfl var geoserverUrl = a.protocol + "//" + a.hostname + ":8080";
var url2 = geoserverUrl + "/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=17&LAYER=" + dataItemName + "&LEGEND_OPTIONS=dx:10.0;dy:0.2;mx:0.2;my:0.2;fontStyle:normal;fontColor:000000;absoluteMargins:true;labelMargin:5;fontSize:13&height=13"
var url = geoengineUrl + "/rest/legend/dataset/" + _this.config.dataset + "/region/" + _this.config.region + "/periodicity/" + _this.config.periodicity + "/statistic/" + _this.config.statistic;
console.log('url2: ', url);

    $.ajax({
      url: geoengineUrl + "/rest/legend/dataset/" + _this.config.dataset + "/region/" + _this.config.region + "/periodicity/" + _this.config.periodicity + "/statistic/" + _this.config.statistic,
      crossDomain: true,
      jsonp: "callback",
      dataType: "json"
    }).done(function (data) {
console.log('in done ');
      if (_this.legendDiv) {
        _this.legendDiv.remove();
      }
      _this.legendDiv = $('<div class="ewx-map-legend-' + _this.config.legendPosition + '"></div>');
      if (_this.config.legendWidth) {
        _this.legendDiv.css('width', _this.config.legendWidth + 'px');
      }
      $('#' + _this.config.id).append(_this.legendDiv);
      $.each(data, function (idx, val) {
        if (val.opacity == 1) {
          var entryDiv = $('<div class="ewx-map-legend-entry"></div>');

          var colorDiv = $('<div class="ewx-map-legend-color"></div>')
            .css('backgroundColor', val.color);

          var valueDiv = $('<div class="ewx-map-value">&nbsp;' + val.label + '</div>');

          entryDiv.append(colorDiv);
          entryDiv.append(valueDiv);
          _this.legendDiv.append(entryDiv);
        }
      });
    }).fail(function (err) {
      console.log("Error: " + url);
    });
  };

  this.calculateTitle = function () {
    var title;
    if (this.config.title === true) {
      var timeString = '';

      var periodicity = this.config.periodicity;
      if (periodicity == '1-month' || periodicity == '2-month' || periodicity == '3-month') {
        timeString += ' ' + monthNumberToName(this.config.period.temporal1);
      } else if (periodicity == '1-dekad') {
        var monthAndDekad = this.dekadToMonthAndDekad(this.config.period.temporal1);
        timeString += monthNumberToName(monthAndDekad.month) + ' dekad ' + monthAndDekad.dekad;
      } else if (periodicity == '1-day') {
        var monthAndDay = this.doyToMonthAndDay(this.config.period.year, this.config.period.temporal1);
        timeString += monthNumberToName(monthAndDay.month) + ', ' + monthAndDay.day;
      } else if (periodicity == '1-pentad') {
	var monthAndPentad = this.pentadToMonthAndPentad(this.config.period.temporal1);
	timeString += monthNumberToName(monthAndPentad.month) + ' pentad ' + monthAndPentad.pentad;
      }

      timeString += ', ' + this.config.period.year;

      title = periodicityDisplayName(periodicity) + ' ' +
        capitaliseFirstLetter(this.config.region) + ' ' +
        this.config.dataset.toUpperCase() + ' ' + timeString + ' ' +
        capitaliseFirstLetter(this.config.statistic);
      if (this.config.units && this.config.units != 'none') {
        title += ' ' + this.config.units;
      }
    } else if (this.config.title === false) {
      title = false;
    } else {
      return this.config.title;
    }

    return title;
  };

  this.dekadToMonthAndDekad = function (dekad) {
    var m = Math.floor((dekad - 1) / 3) + 1;
    var d = dekad - ((m - 1) * 3);

    return {month: m, dekad: d};
  };
 
   this.pentadToMonthAndPentad = function (pentad) {
    var m = Math.floor((pentad - 1) / 6) + 1;
    var p = pentad - ((m -1) * 6);

    return {month: m, pentad: p};
   };

  this.isLeapYear = function (year) {
	return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  };

  this.doyToMonthAndDay = function (year, day) {
  	  
  	// need to make this able to cross the year boundary
  	if(this.isLeapYear(year)) {
  	  d = [0,31,60,91,121,152,182,213,244,274,305,335,366];
  	} else {
  	  d = [0,31,59,90,120,151,181,212,243,273,304,334,365];
  	}
  	  
  	month = 1;
  	while (day > d[month]) {
  	  month++;
  	}
  	day = day - d[month - 1];
  	
    return {month: month, day: day};
  };


  this.loadScript = function (url, callback, done) {
    var headTag = document.getElementsByTagName("head")[0];
    var scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src = url;
    var _self = this;
    if (callback) {
      scriptTag.onload = function () {
        callback.call(_self, done)
      };
    }
    headTag.appendChild(scriptTag);
  };

  if (!this.config.testMode) {
    this.init();
  }
};

var TimeNavigator = function (series) {
  this.isLeapYear = function (year) {
	return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  };

  this.doyToMonthAndDay = function (year, day) {
  	  
  	// need to make this able to cross the year boundary
  	if(this.isLeapYear(year)) {
  	  d = [0,31,60,91,121,152,182,213,244,274,305,335,366];
  	} else {
  	  d = [0,31,59,90,120,151,181,212,243,273,304,334,365];
  	}
  	  
  	month = 1;
  	while (day > d[month]) {
  	  month++;
  	}
  	day = day - d[month - 1];
  	
    return {month: month, day: day};
  };


	this.getPreviousYearIndex = function (name) {
    return series.indexOf(this.getPreviousYearGeoServerName(name));
  };

  this.getNextYearIndex = function (name) {
    return series.indexOf(this.getNextYearGeoServerName(name));
  };

  this.getPreviousTemporal1Index = function (name) {
    return series.indexOf(this.getPreviousTemporal1GeoServerName(name));
  };

  this.getNextTemporal1Index = function (name) {
    return series.indexOf(this.getNextTemporal1GeoServerName(name));
  };

  this.getPreviousTemporal1GeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    if (tokens.periodicity.match(/^\d-month/)) {
      return this.getPreviousMonthGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-dekad/)) {
      return this.getPreviousDekadGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-day/)) {
      return this.getPreviousDayGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-pentad/)) {
      return this.getPreviousPentadGeoServerName(name);
    }
  };

  this.getNextTemporal1GeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    if (tokens.periodicity.match(/^\d-month/)) {
      return this.getNextMonthGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-dekad/)) {
      return this.getNextDekadGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-day/)) {
      return this.getNextDayGeoServerName(name);
    } else if (tokens.periodicity.match(/^\d-pentad/)) {
      return this.getNextPentadGeoServerName(name);
    }
  };

  this.getNextDayGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var day = Number(tokens.temporal1);
    var year = Number(tokens.year);
    if (this.isLeapYear(year)) {
    var nextDay = day < 366 ? day + 1 : 1;
    } else { var nextDay = day < 365 ? day + 1 : 1; }
    tokens.temporal1 = (nextDay < 10 ? '0' : '') + String(nextDay);
    if (this.isLeapYear(year)) { 
    tokens.year = day < 366 ? tokens.year : String(Number(tokens.year) +1);
    } else { tokens.year = day < 365 ? tokens.year : String(Number(tokens.year) +1); }
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousDayGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var day = Number(tokens.temporal1);
    var year = Number(tokens.year);
    var prevyear = year -1;
    if (this.isLeapYear(prevyear)) {
    var nextDay = day > 1 ? day - 1 : 366;
    } else { var nextDay = day > 1 ? day - 1 : 365; } 
    tokens.temporal1 = (nextDay < 10 ? '0' : '') + String(nextDay);
    tokens.year = day > 1 ? tokens.year : String(Number(tokens.year) -1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousDekadGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var dekad = Number(tokens.temporal1);
    var nextDekad = dekad > 1 ? dekad - 1 : 36;
    tokens.temporal1 = (nextDekad < 10 ? '0' : '') + String(nextDekad);
    tokens.year = dekad > 1 ? tokens.year : String(Number(tokens.year) - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getNextDekadGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var dekad = Number(tokens.temporal1);
    var nextDekad = dekad < 36 ? dekad + 1 : 1;
    tokens.temporal1 = (nextDekad < 10 ? '0' : '') + String(nextDekad);
    tokens.year = dekad < 36 ? tokens.year : String(Number(tokens.year) + 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousPentadGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var pentad = Number(tokens.temporal1);
    var nextPentad = pentad > 1 ? pentad - 1 : 72;
    tokens.temporal1 = (nextPentad < 10 ? '0' : '') + String(nextPentad);
    tokens.year = pentad > 1 ? tokens.year : String(Number(tokens.year) -1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
	return geoServerName;
    }
	  
  };

  this.getNextPentadGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var pentad = Number(tokens.temporal1);
    var nextPentad = pentad < 72 ? pentad + 1 :1;
    tokens.temporal1 = (nextPentad < 10 ? '0' : '') + String(nextPentad);
    tokens.year = pentad < 72 ? tokens.year : String(Number(tokens.year) +1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousMonthGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var month = Number(tokens.temporal1);
    var now = new Date(Number(tokens.year), month - 1, 1);
    var nextDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var nextMonth = nextDate.getMonth() + 1;
    var nextYear = nextDate.getFullYear();
    tokens.temporal1 = (nextMonth < 10 ? '0' : '') + String(nextMonth);
    tokens.year = String(nextYear);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getNextMonthGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var month = Number(tokens.temporal1);
    var now = new Date(Number(tokens.year), month - 1, 1);
    var nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var nextMonth = nextDate.getMonth() + 1;
    var nextYear = nextDate.getFullYear();
    tokens.temporal1 = (nextMonth < 10 ? '0' : '') + String(nextMonth);
    tokens.year = String(nextYear);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousYearGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getNextYearGeoServerName = function (name) {
    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year + 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.tokenizeGeoServerName = function (name) {
console.log(name);
    var re = /(\w+)_(\w+)_(\d\-\w+)-(\d\d\d?)-(\d\d\d\d)_(\w+)_([a-zA-Z-]+)/;
    var matches = re.exec(name);
    var retVal = {
      dataset: matches[1],
      region: matches[2],
      periodicity: matches[3],
      temporal1: matches[4],
      year: matches[5],
      units: matches[6],
      statistic: matches[7]
    };

    return retVal;
  };

  this.assembleGeoServerName = function (tokens) {
    return tokens.dataset + '_' + tokens.region + '_' +
      tokens.periodicity + '-' + padDateNumber(tokens.temporal1) + '-' +
      tokens.year + '_' + tokens.units + '_' +
      tokens.statistic;
  };

  this.seriesContainsGeoServerName = function (geoServerName) {
    return series.indexOf(geoServerName) > -1;
  }
};

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthNumberToName(num) {
  return monthNames[num - 1];
}

var periodicityDisplayNames = {
  '1-month': 'Monthly',
  '2-month': 'Two Month',
  '3-month': 'Three Month',
  '1-dekad': 'Dekadal',
  '1-day': 'Daily',
  '1-pentad': 'Pentadal'
};
function periodicityDisplayName(token) {
  return periodicityDisplayNames[token];
}

function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var padDateNumber = function (num) {
  var retVal = String(num);
  if (retVal.length == 1) {
    retVal = '0' + retVal;
  }

  return retVal;
};
