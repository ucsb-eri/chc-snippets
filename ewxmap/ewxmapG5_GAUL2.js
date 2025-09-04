var EwxMapG5 = function(configuration) {

  this.config = configuration;
  var subDataset = this.config.subDataset;
  console.log("periodicity; ", this.config.periodicity);

  this.config.period = this.config.period ? this.config.period : 'latest';
  var latest = this.config.period == 'latest';

  if (typeof this.config.title === 'undefined') {
    this.config.title = true;
  }
  if (!this.config.legendPosition) {
    this.config.legendPosition = 'lower-right';
  }

  if (this.config.periodicity === '1-dekad') {
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
  var layerName;
  var datePart;
  var wmstTime;
  var ewx_config;

  this.readyListeners = [];

  /**
   * Kicks off the application.  Loads jQuery if it is not already loaded by the
   * page in which this snippet is embedded.  Adds a load event listener to window
   * that will execute the next callback (loadAssets).
   */
  this.init = function() {
    // Make sure jQuery is loaded
    var _this = this;
    if (this.config.loadImmediately) {
      this._load();
    } else {
      window.addEventListener('load', function() {
        _this._load();
      });
    }
  };

  this._load = function() {
    var _this = this;
    if (window.jQuery === undefined) {
      console.log('in window undefined...');
      _this.loadScript('https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js', _this.loadAssets, _this.loadEwxConfig);
    } else {
      console.log('in window defined...');
      _this.loadAssets(_this.loadEwxConfig);
      //_this.loadAssets();
    }
  };

  /** ----------------------------------------------------------------------------
   * Loads OpenLayers and application css files.  Loads OpenLayers javascript file
   * if not already loaded.
   *
   * @param done The next callback to execute (this.loadEwxConfig)
   */
  this.loadAssets = function(done) {
    var _this = this;
    console.log('in loadAssets...');

    $(function() {
      if (!window.MAP_STYLES_LOADING && !window.MAP_STYLES_LOADED) {
        window.MAP_STYLES_LOADING = true;
        $("<link/>", {
          rel: "stylesheet",
          type: "text/css",
          href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css"
        }).appendTo("head");

        $("<link/>", {
          rel: "stylesheet",
          type: "text/css",
          href: "https://snippets.chc.ucsb.edu/styles.css"
          // xhref: "file:///Users/marty/Projects/EWX/snippets/Snippets/styles.css"
          // href: "styles.css" mfl
        }).appendTo("head");

        window.MAP_STYLES_LOADED = true;
      }

      if (window.L === undefined) {
        console.log('in window.L === undefined... loading leaflet 1.7.1 ');
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js").done(function() {
          if (done) done.call(_this, _this.loadEwxConfig);
        });
      } else {
        console.log('in window.L NOT === undefined else...');

        if (done) done.call(_this, _this.loadEwxConfig);
      }
    });
  };

  // ----------------------------------------------------------------------------

  this.loadTempralConfigData = function(done) { //mfl NOT USED!

    console.log('in loadTempralConfigData...');

    var _this = this;

    if (this.config.showTimeNav || this.config.showYearControl || this.config.showDekadControl || this.config.showMonthControl) {
      baseUrl = this.config.ewxUrl;
      var a = $('<a>', {
        href: baseUrl
      })[0];
      baseUrl = a.protocol + '//' + a.hostname + ':' + a.port;
      ewxUrlPath = a.pathname;

      console.log('baseUrl: ', baseUrl);


      geoengineUrl = a.protocol + "//" + a.hostname;
      var temporalConfigUrl = 'https://chc-ewx2.chc.ucsb.edu:8919' + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region + '/periodicity/' + _this.config.periodicity + '/statistic/' + _this.config.statistic + '?listCoverages=true';
      // var temporalConfigUrl = geoengineUrl + '/api/rest/version/5.0/config';
      console.log('temporalConfigURL: ', temporalConfigUrl);
      $.ajax({
        url: temporalConfigUrl,
        crossDomain: true,
        jsonp: 'callback',
        dataType: 'jsonp'
      }).done(function(data) {

        console.log('in done ')
        _this.temporalControlsConfig = [];
        $.each(data.data.regions[0].periodicities[0].statistics[0].periodicCoverages, function(i, coverage) {
          _this.temporalControlsConfig.push(coverage.name);
          //console.log('coverage.name: ', coverage.name);
        });
        _this.timeNavigator = new TimeNavigator(_this.temporalControlsConfig);

        if (done) done.call(_this, _this.calculateDataItemName);
      });
    } else {
      if (done) done.call(_this, _this.calculateDataItemName);
    }
  };


  // --------- loadEwxConfig --------------------------------------------------------

  /**
   * Loads the EWX config JSON from the EWX server.  Executes the next
   * callback (calculateDataItemName).
   *
   * @param done The next callback to execute (calculateDataItemName)
   */

  this.loadEwxConfig = function(done) {

    console.log('in loadEwxConfig...');

    baseUrl = this.config.ewxUrl;
    console.log('baseUrl: ', baseUrl);

    // I don't think this a variable is used
    var a = $('<a>', {
      href: baseUrl
    })[0];
    baseUrl = a.protocol + '//' + a.hostname + ':' + a.port;
    ewxUrlPath = a.pathname;

    geoserverUrl = a.protocol + "//" + a.hostname + ":8443";
    geoengineUrl = a.protocol + "//" + a.hostname;

    var _this = this;

    datePart = '01-2020';
    //var myurl = 'https://chc-ewx2.chc.ucsb.edu:8919' + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region +
    //  '/periodicity/' + _this.config.periodicity + '/statistic/' + _this.config.statistic + '/latest'

    var myurl = 'https://chc-ewx3.chc.ucsb.edu/api/rest/version/5.0/config'


    console.log('congif url: ', myurl);
    console.log('_this.config.period: ', _this.config.period);


    //url: geoengineUrl + '/rest/dataset/' + _this.config.dataset + '/region/' + _this.config.region + '/periodicity/' +
      //_this.config.periodicity + '/statistic/' + _this.config.statistic + '/latest',

    if (this.config.period == 'latest') {
      console.log('in latest...');
      console.log('myurl...', myurl);

      $.ajax({
        url: myurl,
        crossDomain: true,
        jsonp: "callback",
        dataType: "jsonp"
      }).done(function(data) {
        console.log('in done...');

        ewx_config = data;
        console.log('ewx_config: ', ewx_config);

        //console.log('done downloading EWX config...');
        console.log('ewx_config for ', _this.config.dataset,': ', ewx_config[_this.config.dataset]);

        //dataItemName = data.data.regions[0].periodicities[0].statistics[0].periodicCoverages[0].name;

        var _ewx_config = ewx_config[_this.config.dataset];
        console.log('_this.config.dataset: ', _this.config.dataset);
        console.log('_ewx_config: ', _ewx_config);

        var periodicity;
        if (_this.config.periodicity == '1-month') {
          periodicity = '1_monthly';
        }
        if (_this.config.periodicity == '1-pentad') { //mfl
          periodicity = 'pentad';
        }
        if (_this.config.periodicity == 'dekad') { //mfl
          periodicity = 'dekad';
        }
        if (_this.config.periodicity == '1-day') {
          periodicity = _this.config.forecastPeriod ;
        }
        if (_this.config.periodicity == '2-month') {
          periodicity = '2_monthly';
        }
        if (_this.config.periodicity == '3-month') {
          periodicity = '3_monthly';
        }

        dataItemName = _this.config.subDataset.toLowerCase() + '_' + _this.config.region + '_' + periodicity + '_' + _this.config.statistic;

        if (_this.config.periodicity === '1-day') {
          console.log('in 1-day periodicity...')
          dataItemName = _this.config.subDataset.toLowerCase() + '_' + _this.config.region + '_' + _this.config.forecastPeriod + '_' + _this.config.statistic;
        }
        console.log('dataItemNamex: ', dataItemName);
        //console.log('dataset config: ', ewx_config.dataset[dataItemName]);

        layerName = 'EWX_' + dataItemName + ':' + dataItemName;
        _this.config.start_date = _ewx_config[dataItemName].end.granule_start;
        _this.config.start_date_arr = _this.config.start_date.split("-");
        console.log('start_date: ', _this.config.start_date);
        console.log('layerName: ', layerName);

        //_this.config.period = data.data.regions[0].periodicities[0].statistics[0].end;

        // MFL All the following need to calc a wmstTime **********

        if (_this.config.periodicity === 'dekad') {
          wmstTime = _ewx_config[dataItemName].end.granule_start;
          console.log('in loadEwxConfig, wmstTime: ', wmstTime);
          _this.config.temporal1 = _this.config.period.dekad;
          _this.config.period.temporal1 = _this.config.period.dekad;
        } else if (_this.config.periodicity === '1-day') {
          wmstTime = _ewx_config[dataItemName].end.granule_start;
          console.log('in loadEwxConfig, wmstTime: ', wmstTime);
          _this.config.temporal1 = _this.config.period.day;
          _this.config.period.temporal1 = _this.config.period.day;
        } else if (_this.config.periodicity === '1-pentad') {
          wmstTime = _ewx_config[dataItemName].end.granule_start;
          console.log('in loadEwxConfig, wmstTime: ', wmstTime);
          _this.config.temporal1 = _this.config.period.period;
          _this.config.period.temporal1 = _this.config.period.pentad;
        } else {
          wmstTime = _ewx_config[dataItemName].end.granule_start;
          console.log('in loadEwxConfig, wmstTime: ', wmstTime);
          _this.config.temporal1 = _this.config.period.month;
          _this.config.period.temporal1 = _this.config.period.month;
        }

        _this.createMap.call(_this, _this.createLegend);


      }).error(function(err) {
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
        console.log('in NOT latest, temporal1: ', _this.config.period.month);
      }

      if (done) done.call(_this, _this.createMap);
    }
  };


  // ----------------------------------------------------------------------------

  this.createMap = function(done) {  // not used when using nav buttons
    console.log('creating map...');

    var rootNode = $('#' + this.config.id); //rootNode is an HTML element with the matching id
    var title = this.calculateTitle();
    console.log('Title: ', title);
    baseUrl = baseUrl + "8443"
    console.log('baseUrl: ', baseUrl);

    if (title) {
      var outerDiv = $('<div class="map-container"></div>').css('width', (this.config.width) + 'px').css('height', (this.config.height + 24) + 'px');
      rootNode.after(outerDiv);
      this.titleDiv = $('<div class="ewx-map-titlebar">' + title + '</div>');
      outerDiv.append(this.titleDiv);
      outerDiv.append(rootNode);
    }

    if (this.config.width) {
      rootNode.css('width', this.config.width + 'px'); //set the rootNode width to this.config.width
    }
    if (this.config.height) {
      rootNode.css('height', this.config.height + 'px');
    }
/** nyet!   if (this.config.time) {
      console.log('in this.config.time...')
      rootNode.css('time', '2022-01-01');
    }
*/
    rootNode.css('border-left', '1px solid gray');
    rootNode.css('border-right', '1px solid gray');
    rootNode.css('border-bottom', '1px solid gray');

    var map = L.map(this.config.id, {  // L is leaflet so this creates a leaflet map object
      center: this.config.center,
      zoom: this.config.zoom,
      attributionControl: false
    });
    this.map = map;

    console.log('creating mapLayer with TIME=', wmstTime);
    var mapLayer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      version: '1.1.0',
      time: wmstTime
    });
    mapLayer.addTo(map);
    this.currentMapLayer = mapLayer;

    var g20080Layer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: "EWX_g2008_1:g2008_1",
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    g20080Layer.addTo(map);
    this.g20080Layer = g20080Layer;

    var g20081Layer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: "EWX_g2008_0:g2008_0",
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    g20081Layer.addTo(map);
    this.g20081Layer = g20081Layer;

    var g20082Layer = L.tileLayer.wms(baseUrl + '/geoserver/wms', {
      layers: "EWX_g2008_2:g2008_2",
      format: 'image/png',
      transparent: true,
      version: '1.1.0'
    });
    g20082Layer.addTo(map);
    this.g20082Layer = g20082Layer;


    var _this = this;

    map.on('click', function(evt) {  //---------- MAP ON CLICK ---------//

      console.log('Map clicked on...');

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
      var reqUrl = geoserverUrl + "/geoserver/wms?REQUEST=GetFeatureInfo" +
        "&EXCEPTIONS=application%2Fvnd.ogc.se_xml" +
        "&BBOX=" + boundsString +
        "&X=" + Math.round(evt.containerPoint.x) + "&Y=" + Math.round(evt.containerPoint.y) +
        "&INFO_FORMAT=text%2Fplain&QUERY_LAYERS=africa%3Ag2008_1" +
        "&FEATURE_COUNT=50&Styles=" +
        "&Layers=africa%3Ag2008_1" +
        "&TIME=2019-05-01" +
        "&Srs=EPSG%3A4326&WIDTH=" + mapWidth + "&HEIGHT=" + mapHeight + "&format=image%2Fpng";
      console.log('reqUrl: ', reqUrl);

      $.ajax({
        url: reqUrl,
        crossDomain: false,
        jsonp: "callback"
      }).done(function(text) {

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
      }).fail(function(err) {
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

      this.timeBar.children('a').each(function(i) {
        $(this).mousemove(function(evt) {
          evt.stopImmediatePropagation(_this.mouseWasMovingOverControl = true)
        });
        $(this).dblclick(function(evt) {
          evt.stopImmediatePropagation(_this.mouseWasMovingOverControl = true)
        });
      });

      rootNode.append(this.timeBar);
    }

    $.each(this.readyListeners, function(i, readyListener) {
      readyListener();
    });

    if (done) done.call(this);
  };


  /**
   * Calculates the GeoServer layer name from config parameters.
   *
   * @param done
   */

  this.calculateDataItemName = function(done) {

    console.log('in calculateDataItemName...');

    if (this.config.periodicity == '1-month' ||
      this.config.periodicity == '2-month' ||
      this.config.periodicity == '3-month') {
      //var month = padDateNumber(this.config.period.month);
      var month = this.config.period.month.padStart(2, "0")
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

    //dataItemName = this.config.dataset + '_' + this.config.region + '_' + this.config.periodicity + '-' +
    //  datePart + '_' + this.config.units + '_' + this.config.statistic;

    console.log('datePart: ', datePart);

    //createMap();
    if (done) done.call(this, this.createLegend);
  };

    // --------------------------------
  this.addReadyListener = function(listener) {
    this.readyListeners.push(listener);
  };


  this.showYearNavigation = function() {
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

  this.hideYearNavigation = function() {
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

  this.showTemporal1Navigation = function() {
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

  this.hideTemporal1Navigation = function() {
    if (this.yearBackButton.css('display') === 'none') {
      this.timeBar.css('display', 'none');
    }
    this.temporal1BackButton.css('display', 'none');
    this.temporal1ForwardButton.css('display', 'none');
    this.timeBar.css('width', '52px');

    this.config.showDekadControl = false;
    this.config.showMonthControl = false;
  };


  this.changeTemporalIndex = function(evt) {
    // All datasets will use WMST Time for navigation. The old ...GeoserverName variable
    // can be removed when wmstTime is implemented for all

    console.log('in changeTemporalIndex, dataItemName: ', dataItemName);
    console.log('wmstTime: ', wmstTime);
    //console.log('evt: ', evt);

    evt.preventDefault();
    evt.stopPropagation();

    if (this.config._makeTimeControlsUnresponsive) {
      return;
    }

    var _ewx_config = ewx_config[this.config.dataset];
    //console.log('_ewx_config', _ewx_config);

    //var timeObj = new Date(wmstTime);
    //console.log('timeObj: ', timeObj);
    //var year = Number(timeObj.getFullYear());
    //var day = Number(timeObj.getDate());
    //var month = Number(timeObj.getMonth()) + 1;
    //console.log('year, month, day: ', year, month, day);

    var timeArr = wmstTime.split("-");
    var year = Number(timeArr[0]);
    var month = Number(timeArr[1]);
    var day = Number(timeArr[2]);
    var y = year;
    var m = month;
    var d = day;
    console.log('y, m, d: ', y, m, d);

    var startWmstTime = _ewx_config[dataItemName].start.granule_start
    //console.log("start time: ", startWmstTime);
    var startTimeArr = startWmstTime.split("-");
    var startYear = Number(startTimeArr[0]);
    var startMonth = Number(startTimeArr[1]);
    var startDay = Number(startTimeArr[2]);

    var endWmstTime = _ewx_config[dataItemName].end.granule_start;
    //console.log("end time: ", endWmstTime);
    var endTimeArr = endWmstTime.split("-");
    var endYear = Number(endTimeArr[0]);
    var endMonth = Number(endTimeArr[1]);
    var endDay = Number(endTimeArr[2]);

    let pentadStartDay = [1, 6, 11, 16, 21, 26];
    let dekadStartDay = [1, 11, 21];

    if (this.isLeapYear(year)) {
      var nDaysMo = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var nDaysYr = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    } else {
      var nDaysMo = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var nDaysYr = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    }

    var startDoy = nDaysYr[startMonth - 1] + startDay;
    var endDoy = nDaysYr[endMonth - 1] + endDay;

    var nextGeoServerName; // remove this when done with wmstTime

    if ($(evt.target).hasClass('previous-year-button')) {

      console.log('in previous-year-button: ', dataItemName );
      y = y - 1;

    } else if ($(evt.target).hasClass('next-year-button')) {

      console.log('in next-year-button: ', dataItemName );
      y = y + 1;


    } // ---------------- Previous Temporal ------------------
    else if ($(evt.target).hasClass('previous-temporal1-button')) {
      //console.log('in previous-temporal1-button... ' );

      if (this.config.periodicity == '1-month') {
        m = m - 1;

        if (m < 1) {
          y = y - 1;
          m = 12;
          //d = 31;
        }
      } else if (this.config.periodicity == '1-day') {
        //console.log('in 1-day...', timeObj);
        console.log('\nin 1-day...', y, m, d);

        //timeObj.setDate(timeObj.getDate() - 1);
        //y = Number(timeObj.getFullYear());
        //m = Number(timeObj.getMonth()) + 1;
        //d = Number(timeObj.getDate());

        //console.log('mid 1-day...', timeObj);
        //console.log('mid 1-day...', typeof(y), m, d);


        d = d - 1;
        if (d < 1) {
          m = m - 1;
          if (m < 1 ) {
            y = y - 1;
            m = 12;
            d = 31;
          } else {
            d = nDaysMo[m];
          }
        }

        console.log('outta 1-day...', typeof(y), m, d);

      } else if (this.config.periodicity == '1-pentad') {
        console.log('in 1-pentad...', d);
        var dayIndex = pentadStartDay.indexOf(d);
        dayIndex = dayIndex - 1;
        console.log('dayIndex =.', dayIndex);

        if (dayIndex < 0) {
          d = pentadStartDay[5];
          m = m - 1;
          if (m < 1) {
            y = y - 1;
            m = 12;
          }
        } else {
          d = pentadStartDay[dayIndex];
        }
      }  else if (this.config.periodicity == 'dekad') {
        console.log('in dekad...', d);
        var dayIndex = dekadStartDay.indexOf(d);
        dayIndex = dayIndex - 1;
        console.log('dayIndex =.', dayIndex);

        if (dayIndex < 0) {
          d = dekadStartDay[2];
          m = m - 1;
          if (m < 1) {
            y = y - 1;
            m = 12;
          }
        } else {
          d = dekadStartDay[dayIndex];
        }
        console.log('day = ', d);
      }
    }  // ---------------- Next Temporal ------------------
    else if ($(evt.target).hasClass('next-temporal1-button')) {
      console.log('in next-temporal1-button: ', this );

      if (this.config.periodicity == '1-month') {
        m = m + 1;

        if (m > 12) {
          y = y + 1;
          m = 1;
          //d = 1;
        }
      } else if (this.config.periodicity == '1-day') {
        console.log('in 1-day...');
        d = d + 1;

        if (d > nDaysMo[m]) {
          m = m + 1;
          if (m > 12 ) {
            y = y + 1;
            m = 1;
            d = 1;
          } else {
            d = 1;
          }
        }
      } else if (this.config.periodicity == '1-pentad') {
        console.log('in 1-pentad...', d);
        var dayIndex = pentadStartDay.indexOf(d);
        dayIndex = dayIndex + 1;
        console.log('dayIndex =.', dayIndex);

        if (dayIndex > 5) {
          d = pentadStartDay[0];
          m = m + 1;
          if (m > 12) {
            y = y + 1;
            m = 1;
          }
        } else {
          d = pentadStartDay[dayIndex];
        }
        console.log('day = ', d);
      } else if (this.config.periodicity == 'dekad') {
        console.log('in dekad...', d);
        var dayIndex = dekadStartDay.indexOf(d);
        dayIndex = dayIndex + 1;
        console.log('dayIndex =.', dayIndex);

        if (dayIndex > 2) {
          d = dekadStartDay[0];
          m = m + 1;
          if (m > 12) {
            y = y + 1;
            m = 1;
          }
        } else {
          d = dekadStartDay[dayIndex];
        }
        console.log('day = ', d);
      }
    }

    var doy = nDaysYr[m - 1] + d;
    var inBounds = true;

    if (y < startYear || y > endYear) {
      inBounds = false;
    } else if (y == startYear && doy < startDoy) {
      inBounds = false;
    } else if (y == endYear && doy > endDoy){
      inBounds = false;
    }

    if (inBounds) {
      wmstTime = String(y) + '-' + String(m).padStart(2, "0") + '-' + String(d).padStart(2, "0")
    }

    // mfl
    //if ((y >= startYear && doy >= startDoy) && (y <= endYear && m <= endMonth)) {
    //  wmstTime = String(y) + '-' + String(m).padStart(2, "0") + '-' + String(d).padStart(2, "0");
    //  console.log('new wmstTime =.', wmstTime);
    //}

    //if (!nextGeoServerName) {
    //  return;
    //}

    //dataItemName = nextGeoServerName;

    //var tokens = this.timeNavigator.tokenizeGeoServerName(dataItemName);
    //this.config.period.year = Number(tokens.year);
    //this.config.period.temporal1 = Number(tokens.temporal1);


    console.log('in setParams, layers: ', 'EWX_' + this.config.dataset + ":" + dataItemName);
    // was in the setParams, layers: 'EWX_' + this.config.dataset + ":" + dataItemName,

    this.currentMapLayer.setParams({
      time: wmstTime
    });

    if (this.titleDiv) {
      this.titleDiv.text(this.calculateTitle());
    }
  };

  // ----------------------------------------------------------------------------

  this.updateRasterLayer = function(tokens) { // does not appear to be called anywhere

    console.log('in updateRasterLayer...');
    var geoServerName = this.timeNavigator.assembleGeoServerName(tokens);

    dataItemName = geoServerName;

    this.config.period.year = Number(tokens.year);
    this.config.period.temporal1 = Number(tokens.temporal1);
    this.config.dataset = tokens.dataset;
    this.config.subDataset = tokens.subDataset;
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

  // ----------------------------------------------------------------------------
  this.createLegend = function() { //not used when using nav buttons
    var _this = this;

    console.log('in createLegend... datePart: ', datePart);
    //_this.calculateDataItemName;
    //var dataItemName = this.config.dataset + ':' + this.config.dataset + '_' + this.config.region + '_' + this.config.periodicity + '-' +
    //  datePart + '_' + this.config.units + '_' + this.config.statistic;

  // mfl var geoserverUrl = a.protocol + "//" + a.hostname + ":8080";
    var url_G5 = geoserverUrl + "/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=17&LAYER=" +
      layerName + "&LEGEND_OPTIONS=dx:10.0;dy:0.2;mx:0.2;my:0.2;fontStyle:normal;fontColor:000000;absoluteMargins:true;labelMargin:5;" +
      "fontSize:13&height=13"
    console.log('url_G5: ', url_G5);

    var url_eros = 'https://dmsdata.cr.usgs.gov/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&' +
      'FORMAT=image/png&LAYER=fews_chirps_global_pentad_data:chirps_global_pentad_data&SCALE=40483992.68881473&' +
      'STYLE=fews_chirps_pentad_data_raster_ngviewer_legend&WIDTH=20&HEIGHT=17&LEGEND_OPTIONS=fontStyle:normal;' +
      'fontColor:000000;fontSize:13;absoluteMargins:true;labelMargin:5;dx:10;dy:0.2;mx:0.2;my:0.2;'
    console.log('xxx url_eros: ', url_eros);

/**
    var url_G4 = geoengineUrl + "/geoserver/wms" + _this.config.dataset + "/region/" + _this.config.region + "/periodicity/" +
      _this.config.periodicity + "/statistic/" + _this.config.statistic;
    console.log('url_G4: ', url_G4);
*/

    $.ajax({
      url: url_G5,
      crossDomain: true,
      jsonp: "callback",
      dataType: "image/png"
    }).done(function(data) {
      console.log('in done ');
      if (_this.legendDiv) {
        _this.legendDiv.remove();
      }
      _this.legendDiv = $('<div class="ewx-map-legend-' + _this.config.legendPosition + '"></div>');
      if (_this.config.legendWidth) {
        _this.legendDiv.css('width', _this.config.legendWidth + 'px');
      }
      $('#' + _this.config.id).append(_this.legendDiv);
      $.each(data, function(idx, val) {
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
    }).fail(function(err) {
      console.log("Error: " + url_G5);
    });
    console.log('exit createLegend...');
  };

  // ----------------------------------------------------------------------------
  this.calculateTitle = function() {

    var title;
    if (this.config.title === true) {
      var timeString = wmstTime;
      //var timeString = this.config.start_date;
      var periodicity = this.config.periodicity;

      console.log("in calculateTitle, timeString: ", timeString);
/*
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
*/

        var periodDisName = periodicityDisplayName(periodicity);
        if (this.config.periodicity == '1-day') {
          var periodDisName = this.config.forecastPeriod;
        }
        title = periodDisName + ' ' +
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

    console.log("done calculateTitle, title: ", title, "\n\n");
    console.log(".");
    console.log(".");
    return title;
  };

  this.dekadToMonthAndDekad = function(dekad) {
    var m = Math.floor((dekad - 1) / 3) + 1;
    var d = dekad - ((m - 1) * 3);

    return {
      month: m,
      dekad: d
    };
  };

  this.pentadToMonthAndPentad = function(pentad) {
    var m = Math.floor((pentad - 1) / 6) + 1;
    var p = pentad - ((m - 1) * 6);

    return {
      month: m,
      pentad: p
    };
  };

  this.isLeapYear = function(year) {
    return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  };

  this.doyToMonthAndDay = function(year, day) {

    // need to make this able to cross the year boundary
    if (this.isLeapYear(year)) {
      d = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    } else {
      d = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    }

    month = 1;
    while (day > d[month]) {
      month++;
    }
    day = day - d[month - 1];

    return {
      doy: doy
    };
  };

  this.MonthAndDayToDoy = function(year, month, day) { //mfl

    // need to make this able to cross the year boundary
    if (this.isLeapYear(year)) {
      d = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    } else {
      d = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    }

    doy = d[month - 1] + day
    month = 1;
    while (day > d[month]) {
      month++;
    }
    day = day - d[month - 1];

    return {
      month: month,
      day: day
    };
  };

  this.loadScript = function(url, callback, done) {
    console.log('in loadScript...');
    var headTag = document.getElementsByTagName("head")[0];
    var scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src = url;
    var _self = this;
    if (callback) {
      console.log('in callback...');
      scriptTag.onload = function() {
        callback.call(_self, done)
      };
    }
    headTag.appendChild(scriptTag);
  };

  if (!this.config.testMode) {
    this.init();
  }
};

// ----------------------------------------------------------------------------
var TimeNavigator = function(series) {

  this.isLeapYear = function(year) {
    return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  };

  this.doyToMonthAndDay = function(year, day) {

    // need to make this able to cross the year boundary
    if (this.isLeapYear(year)) {
      d = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    } else {
      d = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    }

    month = 1;
    while (day > d[month]) {
      month++;
    }
    day = day - d[month - 1];

    return {
      month: month,
      day: day
    };
  };


  this.getPreviousYearIndex = function(name) {  // all these getNext... are not used ****
    return series.indexOf(this.getPreviousYearGeoServerName(name));
  };

  this.getNextYearIndex = function(name) {
    return series.indexOf(this.getNextYearGeoServerName(name));
  };

  this.getPreviousTemporal1Index = function(name) {
    return series.indexOf(this.getPreviousTemporal1GeoServerName(name));
  };

  this.getNextTemporal1Index = function(name) {
    return series.indexOf(this.getNextTemporal1GeoServerName(name));
  };

  this.getPreviousTemporal1GeoServerName = function(name) {
    console.log('in getPreviousTemporal1GeoServerName, name: ', name);

    var tokens = this.tokenizeGeoServerName(name);
    console.log('tokens: ', tokens);

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

  this.getNextTemporal1GeoServerName = function(name) {
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

  this.getNextDayGeoServerName = function(name) {
    var tokens = this.tokenizeGeoServerName(name);
    var day = Number(tokens.temporal1);
    var year = Number(tokens.year);
    if (this.isLeapYear(year)) {
      var nextDay = day < 366 ? day + 1 : 1;
    } else {
      var nextDay = day < 365 ? day + 1 : 1;
    }
    tokens.temporal1 = (nextDay < 10 ? '0' : '') + String(nextDay);
    if (this.isLeapYear(year)) {
      tokens.year = day < 366 ? tokens.year : String(Number(tokens.year) + 1);
    } else {
      tokens.year = day < 365 ? tokens.year : String(Number(tokens.year) + 1);
    }
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousDayGeoServerName = function(name) {
    var tokens = this.tokenizeGeoServerName(name);
    var day = Number(tokens.temporal1);
    var year = Number(tokens.year);
    var prevyear = year - 1;
    if (this.isLeapYear(prevyear)) {
      var nextDay = day > 1 ? day - 1 : 366;
    } else {
      var nextDay = day > 1 ? day - 1 : 365;
    }
    tokens.temporal1 = (nextDay < 10 ? '0' : '') + String(nextDay);
    tokens.year = day > 1 ? tokens.year : String(Number(tokens.year) - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousDekadGeoServerName = function(name) {
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

  this.getNextDekadGeoServerName = function(name) {
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

  this.getPreviousPentadGeoServerName = function(name) {
    var tokens = this.tokenizeGeoServerName(name);
    var pentad = Number(tokens.temporal1);
    var nextPentad = pentad > 1 ? pentad - 1 : 72;
    tokens.temporal1 = (nextPentad < 10 ? '0' : '') + String(nextPentad);
    tokens.year = pentad > 1 ? tokens.year : String(Number(tokens.year) - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }

  };

  this.getNextPentadGeoServerName = function(name) {
    var tokens = this.tokenizeGeoServerName(name);
    var pentad = Number(tokens.temporal1);
    var nextPentad = pentad < 72 ? pentad + 1 : 1;
    tokens.temporal1 = (nextPentad < 10 ? '0' : '') + String(nextPentad);
    tokens.year = pentad < 72 ? tokens.year : String(Number(tokens.year) + 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousMonthGeoServerName = function(name) {
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

  this.getNextMonthGeoServerName = function(name) {
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

  this.getPreviousYearWmstTime = function(wmstTime) { // not used
    console.log('in getPreviousYearWmstTime, wmstTime: ', wmstTime);

    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getNextYearWmstTime = function(wmstTime) {
    console.log('in getNextYearWmstTime, wmstTime: ', wmstTime);

    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year + 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getPreviousYearGeoServerName = function(name) {
    console.log('in getPreviousYearGeoServerName, name: ', name);

    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year - 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.getNextYearGeoServerName = function(name) {
    var tokens = this.tokenizeGeoServerName(name);
    var year = Number(tokens.year);
    tokens.year = String(year + 1);
    var geoServerName = this.assembleGeoServerName(tokens);
    if (this.seriesContainsGeoServerName(geoServerName)) {
      return geoServerName;
    }
  };

  this.tokenizeGeoServerName = function(name) { //chirps_africa_1-dekad-30-2022_mm_anomaly
    console.log('tokenizeGeoServerName, name: ',name);
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

  this.assembleGeoServerName = function(tokens) {
    return tokens.dataset + '_' + tokens.region + '_' +
      tokens.periodicity + '-' + padDateNumber(tokens.temporal1) + '-' +
      tokens.year + '_' + tokens.units + '_' +
      tokens.statistic;
  };

  this.seriesContainsGeoServerName = function(geoServerName) {
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
  'dekad': 'Dekadal',
  '1-day': 'Daily',
  '1-pentad': 'Pentadal'
};

function periodicityDisplayName(token) {
  return periodicityDisplayNames[token];
}

function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var padDateNumber = function(num) {
  var retVal = String(num);
  if (retVal.length == 1) {
    retVal = '0' + retVal;
  }

  return retVal;
};
