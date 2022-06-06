var scraper=require('./scraper');
var time=600;//This times milliseconds 1000 = 1 second
(function loop() {
  setTimeout(function () {
    scraper.scrape();
    console.log('Scraping....')
    loop()
  }, 1000*time); //9000 = 9000ms = 9s
});