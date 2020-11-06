import axios from 'axios';
import { $ } from './bling';

const initialLat = 43.2;
const initialLng = -79.8;

const mapOptions = {
  center: {
    lat: initialLat,
    lng: initialLng
  },
  zoom: 13
};

function loadPlaces(map, lat = initialLat, lng = initialLng) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        return;
      }
      // create the bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({
          map,
          position,
        });
        marker.place = place;
        // when some click on the marker, show the details of that place
        marker.addListener('click', function () {
          const html = `
           <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
           </div>
          `;
          infoWindow.setContent(html);
          infoWindow.open(map, this);
        });
        return marker;
      });


      // Zoom the map to fit the markers
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) {
    return;
  }

  // Make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  // You need your credit card
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;

// navigator.geolocation.getCurrentPosition to get from the user