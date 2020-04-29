
// Uncomment to enable Bootstrap tooltips
// https://getbootstrap.com/docs/4.0/components/tooltips/#example-enable-tooltips-everywhere
// $(function () { $('[data-toggle="tooltip"]').tooltip(); });

// Uncomment to enable Bootstrap popovers
// https://getbootstrap.com/docs/4.0/components/popovers/#example-enable-popovers-everywhere
// $(function () { $('[data-toggle="popover"]').popover(); });

var products = {};

mapboxgl.accessToken = 'pk.eyJ1Ijoibml5YW5kbyIsImEiOiJjazlsMzA1MGowMGxsM2ZwOWRtYjlrcDluIn0.DhI3gk3OvRvtA2vMRbOz0g';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  zoom: 1.5
});

var markers = [];

$(document).ready(function(){

  $.get('https://api.airtable.com/v0/appQy6EXyIOwI0Top/products?api_key=keyXXRCjWbcyCSC6F', function(response){
    response.records.forEach(function(product){
      products[product.id] = {
        name: product.fields['Name'],
        icon: product.fields['Product Icon'][0]['thumbnails']['small']['url'],
      };
      $('select#products,select#filter').append($('<option></option>').attr('value',product.id).text(product.fields['Name']));
    })

    $.get('https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers?api_key=keyXXRCjWbcyCSC6F', function(response){
      response.records.forEach(function(customer){
        plotCustomerOnMap(customer)
      })
    });
  });


  $('form#customerForm').on('submit', function(e){
    e.preventDefault();
    var customer = {};
    customer['fields'] = {}
    customer['fields']['Customer Name'] = $('input#customer_name').val();
    customer['fields']['Latitude'] = $('input#customer_lat').val();
    customer['fields']['Longitude'] = $('input#customer_lng').val();
    customer['fields']['Product'] = [$('select#products').val()];
    customer['fields']['Address'] = $('input#customer_address').val();

    $.ajax({url:'https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers',
      type: 'POST',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer keyXXRCjWbcyCSC6F');
      },
      data: {records: [customer]},
      success: function (r) {
        plotCustomerOnMap(r.records[0]);
        $('#customerModal').modal('hide');
      },
      error: function () { }
    })
  });

  function plotCustomerOnMap(customer){
    var lat = customer.fields['Latitude'];
    var lng = customer.fields['Longitude'];
    var address = customer.fields['Address'];
    var el = document.createElement('div');
    el.style.backgroundImage = `url(${products[customer.fields['Product'][0]].icon})`
    el.style.width = '20px'
    el.style.height = '20px'

    if((!lat || !lng) && address.length > 0 ){
      plotUsingGeoCode(customer);
    }
    else if(lat && lng){
      var marker = new mapboxgl.Marker(el).setLngLat([lng, lat]);
      markers.push(marker);
      var popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
        '<p>'+customer.fields['Customer Name']+'</p><p>('+products[customer.fields['Product'][0]].name+')</p>'
        );
      marker.setPopup(popup).addTo(map);
    }
  }

  $('select#filter').on('change',function(){
    var filter = $(this).val();
    if(filter){clearMarkers();}
    $.get('https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers?api_key=keyXXRCjWbcyCSC6F', function(response){
      response.records.forEach(function(customer){
        if(filter == 1 || customer.fields['Product'][0] == filter){plotCustomerOnMap(customer)}
      })
    });
  })

  function clearMarkers(){
    markers.forEach(function(m){
      m.remove();
    })
  }

  function plotUsingGeoCode(customer){
    $.get("https://api.mapbox.com/geocoding/v5/mapbox.places/"+encodeURI(customer.fields['Address'])+".json?access_token=pk.eyJ1Ijoibml5YW5kbyIsImEiOiJjazlsMzA1MGowMGxsM2ZwOWRtYjlrcDluIn0.DhI3gk3OvRvtA2vMRbOz0g", function(response){
      var center = response.features[0]['center'];
      var marker = new mapboxgl.Marker().setLngLat([center[0], center[1]]);
      markers.push(marker);
      var popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
        '<p>'+customer.fields['Customer Name']+'</p><p>('+products[customer.fields['Product'][0]].name+')</p>'
        );
      marker.setPopup(popup).addTo(map);
    });
  }

});
