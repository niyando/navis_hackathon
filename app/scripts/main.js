
// Uncomment to enable Bootstrap tooltips
// https://getbootstrap.com/docs/4.0/components/tooltips/#example-enable-tooltips-everywhere
// $(function () { $('[data-toggle="tooltip"]').tooltip(); });

// Uncomment to enable Bootstrap popovers
// https://getbootstrap.com/docs/4.0/components/popovers/#example-enable-popovers-everywhere
// $(function () { $('[data-toggle="popover"]').popover(); });

mapboxgl.accessToken = 'pk.eyJ1Ijoibml5YW5kbyIsImEiOiJjazlsMzA1MGowMGxsM2ZwOWRtYjlrcDluIn0.DhI3gk3OvRvtA2vMRbOz0g';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  zoom: 1.5
});

$(document).ready(function(){
  $.get('https://api.airtable.com/v0/appQy6EXyIOwI0Top/customers?api_key=keyXXRCjWbcyCSC6F', function(response){
    response.records.forEach(function(customer){
      var lat = customer.fields['Latitude'];
      var lng = customer.fields['Longitude'];
      console.log(lat,lng)
      if(lat && lng){
        var marker = new mapboxgl.Marker().setLngLat([lng, lat]);

        var popup = new mapboxgl.Popup({ offset: 35 }).setHTML(
          "<p></p><p>"+customer.fields['Customer Name']+"</p>"
          );
        marker.setPopup(popup).addTo(map);
      }
    })
  })
});
