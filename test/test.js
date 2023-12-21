/*
it should
  be a function
*/

test("EwxMap is a function", function() {
  ok(typeof EwxMap === 'function', "EwxMap is a function");
});

module("EwxMap method tests", {
  beforeEach: function() {
    this.mapConfig = {
      // ewxUrl: 'http://chg-ewx.geog.ucsb.edu:8080',
      id: 'ewx-map-1',
      ewxUrl: 'http://localhost:8080/ewx-viewer-2.1.1',
      dataset: 'lst',
      region: 'africa',
      periodicity: '1-month',
      period: 'latest',
      units: 'c-deg',
      statistic: 'data',
      width: 427,
      height: 455,
      zoom: 3,
      center: [17, 1.5],
      testMode: true
    };
  }
});

test("loadConfig() loads EWX JSON", function(assert) {
  var ewxMap = new EwxMap(this.mapConfig);

  var done = assert.async();

  setTimeout(function() {
    ewxMap.init();
    ewxMap.loadEwxConfig();
    ok(ewxMap.config.period);
    done();
    console.log(ewxMap.config.period);
  });
});