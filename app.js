var App = function() {
  var self = this;
  var polling_rate = 10000;
  var num_width;
  var num_height;
  var num_listings;
  var listings_url;
  var query_string = window.location.search.slice(1);
  var $body = $('body');

  self.last_listing = null;

  self.init = function() {
    num_width = calcNumWidth();
    num_height = calcNumHeight();
    num_listings = num_width * num_height;
    listings_url = 'https://reverb.com/api/listings.json?per_page=' + num_listings;
    if (query_string.length) {
      listings_url += "&" + query_string;
    }

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
      self.last_listing = listings[0];

      for(var i=0; i<num_listings; i++) {
        self.cells[i].queueListingAndShow(listings[i]);
      }
    });
  }

  function renderCells() {
    for(var i=0; i<self.cells.length; i++) {
      var $cell = self.cells[i].render();
      $cell.css({width: (100/num_width)+"%", height: (100/num_height)+"%"});
      $body.append($cell);
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
    self.last_listing = listings[0];
    console.log(new_listings);

    for (var i=0; i<new_listings.length; i++) {
      selected_cells[i].queueListingAndShow(new_listings[i]);
    }
  }

  function filterNewListings(listings) {
    // only return listings we haven't already fetched
    var new_listings = [];

    for(var i=0; i<listings.length; i++) {
      var listing = listings[i];
      if (listing._links.self.href == self.last_listing._links.self.href) { break; }
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

  function calcNumWidth() {
    if ($body.width() > 1500) {
      return 9;
    } else if ($body.width() > 1000) {
      return 7;
    } else {
      return 5;
    }
  }

  function calcNumHeight() {
    if ($body.width() > 1500) {
      return 5;
    } else if ($body.width() > 1000) {
      return 4;
    } else {
      return 3;
    }
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

  self.queueListingAndShow = function(listing) {
    self.queueListing(listing);
    self.flip();
  }

  self.flip = function() {
    var new_face_selector = self.front ? '.cell-back' : '.cell-front';
    var $new_face = self.$el.find(new_face_selector);

    self.active_listing = self.next_listing;
    self.next_listing = null;

    $new_face.html(renderListing(self.active_listing));

    $new_face.find('img').on('load', function() {
      self.front = !self.front;
      self.$el.toggleClass('flipped');
    });
  }

  self.render = function() {
    $html = $("<div class='cell'><div class='cell-front'></div><div class='cell-back'></div></div>");
    self.$el = $html;
    return $html;
  }

  function renderListing(listing) {
    return "<a href='" + listing._links.web.href + "' target='_blank'><img src='" + listing._links.photo.href + "'>" + renderInfo(listing) + "</a>";
  }

  function renderInfo(listing) {
    var html = "<div class='price'>$" + listing.price.amount.replace(/\..*/, "") + "</div>" +
               "<div class='title'>" +
                 "<div class='make'>" + listing.make + "</div>" +
                 "<div class='model'>" + listing.model + "</div>" +
               "</div>";
    return html;
  }
};

$(function() {
  app = new App();
  app.init();
})
