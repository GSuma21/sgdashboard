// Karma configuration file
// Works with Angular 17+, ChromeHeadless, and SonarCloud

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],

    client: {
      jasmine: {},
      clearContext: false
    },

    jasmineHtmlReporter: {
      suppressAll: true
    },

    // Coverage output for SonarCloud
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly', file: 'lcov.info' },
        { type: 'text-summary' }
      ]
    },

    reporters: ['progress', 'kjhtml', 'coverage'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    // ✅ CI-friendly settings
    browsers: ['ChromeHeadless'], // headless Chrome for CI
    singleRun: true,              // run once and exit
    autoWatch: false,             // do not watch files
    restartOnFileChange: false
  });
};
