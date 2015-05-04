var App = function() {
  var self = this;
  var polling_rate = 3000;
  var num_width = 9;
  var num_height = 5;
  var num_listings = num_width * num_height;
  var listings_url = 'https://reverb.com/api/listings.json?per_page=' + num_listings;
  var $body = $('body');

  self.last_listing_title = null;

  self.init = function() {
    initCells();
    renderCells();
    setTimeout(updateListings, polling_rate);
  }

  function initCells() {
    self.cells = [];
    for(var i=0; i<num_listings; i++) {
      self.cells[i] = new Cell();
    }

    fetchListings(function(listings) {
      self.last_listing_title = listings[0].title;

      for(var i=0; i<num_listings; i++) {
        self.cells[i].queueListing(listings[i]);
        self.cells[i].flip();
      }
    });
  }

  function renderCells() {
    for(var i=0; i<self.cells.length; i++) {
      $body.append(self.cells[i].render());
    }
  }

  function fetchListings(callback) {
    $.get(listings_url, function(data) {
      var listings = data['listings'];
      callback(listings);
    });
  }

  function updateListings() {
    fetchListings(parseNewListings);
    setTimeout(updateListings, polling_rate);
  }

  function parseNewListings(listings) {
    var new_listings = filterNewListings(listings);
    var selected_cells = selectCellsToUpdate(new_listings.length)
    self.last_listing_title = listings[0].title;
    console.log(new_listings);

    for (var i=0; i<new_listings.length; i++) {
      selected_cells[i].queueListing(new_listings[i]);
      selected_cells[i].delayFlip(1000);
    }
  }

  function filterNewListings(listings) {
    // only return listings we haven't already fetched
    var new_listings = [];

    for(var i=0; i<listings.length; i++) {
      var listing = listings[i];
      if (listing.title == self.last_listing_title) { break; }
      new_listings.push(listing);
    }

    return new_listings;
  }

  function selectCellsToUpdate(n) {
    // return n cells (randomly)
    var result = new Array(n),
        len = self.cells.length,
        taken = new Array(len);
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = self.cells[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
  }
};

var Cell = function() {
  var self = this;
  self.listings = []; // [older, newer]
  self.active_listing = null;
  self.next_listing = null;
  self.front = true;
  self.$el = null;

  self.queueListing = function(listing) {
    self.next_listing = listing;
  }

  self.flip = function() {
    var new_face_selector = self.front ? '.cell-back' : '.cell-front';
    var $new_face = self.$el.find(new_face_selector);
    $new_face.html(renderListing(self.next_listing));

    self.active_listing = self.next_listing;
    self.next_listing = null;

    self.front = !self.front;
    self.$el.toggleClass('flipped');
  }

  self.delayFlip = function(ms) {
    setTimeout(function() {
      self.flip();
    }, ms);
  }

  self.render = function() {
    $html = $("<div class='cell'><div class='cell-front'></div><div class='cell-back'></div></div>");
    self.$el = $html;
    return $html;
  }

  function renderListing(listing) {
    return "<a href='" + listing._links.web.href + "' target='_blank'><img src='" + listing._links.photo.href + "'></a>";
  }
};

$(function() {
  app = new App();
  app.init();
})
