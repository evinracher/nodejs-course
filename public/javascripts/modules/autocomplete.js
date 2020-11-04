// Google maps does this that way. First lat and then lng
function autocomplete(input, latInput, lngInput){
  console.log(input, latInput, lngInput);
  if(!input) return; //skip if there is no input on the page
  // I need a credit card for this:
  // const dropdown = new google.maps.places.Autocomplete(input);
  // dropdown.addListener('place_changed', () => { 
  //   const place = dropdown.getPlace();
  //   latInput.value = place.geometry.location.lat();
  //   lngInput.value = place.geometry.location.lng();
  // });
  input.on('keydown', (e) => {
    if(e.keyCode === 13) {
      e.preventDefault();
    }
  });
}

export default autocomplete;