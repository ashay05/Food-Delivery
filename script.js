const headertextLoc = document.getElementById("header-location-text");

navigator.geolocation.getCurrentPosition((position)=>{
    const { latitude, longitude } = position.coords;
    reverseLoc(latitude, longitude).then((location) => {
        const { name, state, country } = location;
        headertextLoc.textContent = `${name}, ${state}, ${country}`;
    }
})

async function reverseLoc(latitude, longitude) {
  headertextLoc.textContent = "Fetching location...";
  try {
    const res = await fetch(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=9dc0f9a188ac66ed5a8c20b544cf36b7`,
    );
    const data = await res.json();
    const { name, state, country } = data[0];
    return { name, state, country };
  } catch (error) {
    alert("Error fetching location: " + error.message);
  }finally{
  headertextLoc.textContent = "Fetching location...";
  }
}
