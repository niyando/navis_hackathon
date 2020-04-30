// Uncomment to enable Bootstrap tooltips
// https://getbootstrap.com/docs/4.0/components/tooltips/#example-enable-tooltips-everywhere
// $(function () { $('[data-toggle='tooltip']').tooltip(); });

// Uncomment to enable Bootstrap popovers
// https://getbootstrap.com/docs/4.0/components/popovers/#example-enable-popovers-everywhere
// $(function () { $('[data-toggle='popover']').popover(); });

var DEFAULT_LOCATION_ID = "rece0kxEDy19uw04K";
var products = {};

mapboxgl.accessToken = api_keys.map_box;

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v10",
  zoom: 1.5,
});

var markers = [];

const getPopup = function ({ customer, product }) {
  return new mapboxgl.Popup({ offset: 10 }).setHTML(
    `<p class="mt-3">
      <strong>${customer["Customer Name"]}</strong><br>
      <strong>Product:</strong>  ${product} <br>
      <strong>Client/Office:</strong>  ${customer["Location Type"]}
    </p>`
  );
};

$(document).ready(function () {
  $.get(
    "https://api.airtable.com/v0/appQy6EXyIOwI0Top/products?api_key=" +
      api_keys.airtable,
    function (response) {
      response.records.forEach(function (product) {
        products[product.id] = {
          name: product.fields["Name"],
          icon: product.fields["Product Icon"][0]["thumbnails"]["small"]["url"],
        };
        $("select#products,select#filter").append(
          $("<option></option>")
            .attr("value", product.id)
            .text(product.fields["Name"])
        );
      });

      $.get(
        "https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers?api_key=" +
          api_keys.airtable,
        function (response) {
          response.records.forEach(function (customer) {
            plotCustomerOnMap(customer);
          });
        }
      );
    }
  );

  $("form#customerForm").on("submit", function (e) {
    e.preventDefault();
    var customer = {};
    customer["fields"] = {};
    customer["fields"]["Customer Name"] = $("input#customer_name").val();
    customer["fields"]["Latitude"] = $("input#customer_lat").val();
    customer["fields"]["Longitude"] = $("input#customer_lng").val();
    customer["fields"]["Product"] = [$("select#products").val()];
    customer["fields"]["Address"] = $("input#customer_address").val();
    customer["fields"]["Location Type"] = $("select#loc_type").val();

    $.ajax({
      url: "https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers",
      type: "POST",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("Authorization", "Bearer " + api_keys.airtable);
      },
      data: { records: [customer] },
      success: function (r) {
        plotCustomerOnMap(r.records[0]);
        $("#customerModal").modal("hide");
      },
      error: function () {},
    });
  });

  function plotCustomerOnMap(customer) {
    var lat = customer.fields["Latitude"];
    var lng = customer.fields["Longitude"];
    var address = customer.fields["Address"];
    var el = document.createElement("div");
    el.className = "marker";
    let backgroundImage;
    if (customer.fields["Icon"]) {
      backgroundImage = customer.fields["Icon"][0].thumbnails.small.url;
    } else if (customer.fields["Product"]) {
      backgroundImage = products[customer.fields["Product"][0]].icon;
    } else {
      backgroundImage = products[DEFAULT_LOCATION_ID].icon;
    }
    el.style.backgroundImage = `url(${backgroundImage})`;

    if ((!lat || !lng) && address.length > 0) {
      plotUsingGeoCode(customer, el);
    } else if (lat && lng) {
      var marker = new mapboxgl.Marker(el).setLngLat([lng, lat]);
      markers.push(marker);
      const productName = customer.fields["Product"]
        ? products[customer.fields["Product"][0]].name
        : "Office";
      var popup = getPopup({
        customer: customer.fields,
        product: productName,
      });
      marker.setPopup(popup).addTo(map);
    }
    map.zoomTo(1.5, { duration: 1000 });
  }

  $("select#filter").on("change", function () {
    var filter = $(this).val();
    if (filter) {
      clearMarkers();
    }
    $.get(
      "https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers?api_key=" +
        api_keys.airtable,
      function (response) {
        response.records.forEach(function (customer) {
          if (
            filter == 1 ||
            (customer.fields["Product"] &&
              customer.fields["Product"][0] == filter)
          ) {
            plotCustomerOnMap(customer);
          }
        });
      }
    );
  });

  function clearMarkers() {
    markers.forEach(function (m) {
      m.remove();
    });
  }

  function plotUsingGeoCode(customer, el) {
    $.get(
      "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        encodeURI(customer.fields["Address"]) +
        ".json?access_token=" +
        api_keys.map_box,
      function (response) {
        if (response.features.length > 0) {
          var center = response.features[0]["center"];
          var marker = new mapboxgl.Marker(el).setLngLat([
            center[0],
            center[1],
          ]);
          markers.push(marker);
          const productName = customer.fields["Product"]
            ? products[customer.fields["Product"][0]].name
            : "Office";
          var popup = getPopup({
            customer: customer.fields,
            product: productName,
          });
          marker.setPopup(popup).addTo(map);
        } else {
          console.log("Not able to lookup", customer);
        }
      }
    );
  }
});
