'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// const btnsMenu = document.querySelector('.btns-menu');
const btnRest = document.querySelector('.btn-reset');
// const btnEdit=document.querySelector('btn-primary')
// const btnSort=document.querySelector('.btn-sort')

let map, mapEvent;

class Workout {
  date = new Date();
  clicks = 0;
  id = Date.now() + ''.slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`.padStart(2, 0);
  }
  //   click() {
  //     this.clicks++;
  //   }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this._setDescription();

    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, evaluationGain) {
    super(coords, distance, duration);
    this.evaluationGain = evaluationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([20, 40], 50, 60, 128);
const cycling1 = new Cycling([20, 40], 50, 60, 200);
console.log(run1, cycling1);
//////////////////architcure////////////////////////////////////////////
class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  type;
  constructor() {
    // get position
    this._getPosition();

    this._getLocalStorage();
    // event handeler
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener(
      'change',
      this._toggleEvaluationField.bind(this)
    );
    containerWorkouts.addEventListener('click', this._moveTopPopup.bind(this));
    btnRest.addEventListener('click', this.reset);

    // Ensure that we are passing the specific workout to the event listener
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function (err) {
          alert(err.message);
        }
      );
  }
  _loadMap(position) {
    console.log(position);
    const { longitude } = position.coords;
    const { latitude } = position.coords;
    console.log(longitude, latitude);
    console.log(`https://www.google.com/maps/@${longitude},${latitude}`);
    const coords = [longitude, latitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    console.log(this.#map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //   clear value
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);

    // btnsMenu.classList.remove('btns-menu--hidden');
  }
  _toggleEvaluationField() {
    inputElevation.closest('.form__row ').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row ').classList.toggle('form__row--hidden');

    // console.log(e);
  }

  _newWorkout(e) {
    e.preventDefault();

    // validation input form number or no

    const validationForm = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    //    console.log(validationForm(8,6,7));

    //vallidation input not negative

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout running  , create running object

    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validationForm(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
      )
        alert('Inputs have to positive number!');
      // add new object to array
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout cycling, create running object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (!validationForm(distance, duration, elevation))
        alert('Inputs have to positive number!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();

    // console.log(mapEvent.latlng);

    // render workout on map
  }
  _renderWorkoutMarker(workout) {
    //   console.log(lat, lng);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  // Method to pre-fill the form with the workout data
  // _editInput(workout) {
  //   // Pre-fill the form with the data of the specific workout
  //   inputType.value = workout.type;
  //   inputDistance.value = workout.distance;
  //   inputDuration.value = workout.duration;

  //   // If the workout is running, pre-fill the cadence field
  //   if (workout.type === 'running') {
  //     inputCadence.value = workout.cadence;
  //   }

  //   // If the workout is cycling, pre-fill the elevation gain field
  //   if (workout.type === 'cycling') {
  //     inputElevation.value = workout.evaluationGain;
  //   }

  //   // Show the form
  //   form.classList.remove('hidden');
  //   inputDistance.focus();
  //   this.currentWorkout = workout; // Store the workout to edit later
  // }
  // Method to update the existing workout

  // _deleteWorkout(workout) {
  //   // Remove the workout from the workouts array
  //   this.#workouts = this.#workouts.filter(w => w.id !== workout.id);

  //   // Remove the workout element from the DOM
  //   const workoutElement = containerWorkouts.querySelector(
  //     `.workout[data-id="${workout.id}"]`
  //   );
  //   workoutElement.remove();

  //   // Update localStorage to reflect the changes
  //   this._setLocalStorage();
  // }
  // _updateWorkout(e) {
  //   e.preventDefault();

  //   // Get the updated values from the form
  //   const distance = +inputDistance.value;
  //   const duration = +inputDuration.value;
  //   let updatedWorkout;

  //   // Update the workout based on its type
  //   if (this.currentWorkout.type === 'running') {
  //     const cadence = +inputCadence.value;
  //     updatedWorkout = new Running(
  //       this.currentWorkout.coords,
  //       distance,
  //       duration,
  //       cadence
  //     );
  //   }

  //   if (this.currentWorkout.type === 'cycling') {
  //     const elevation = +inputElevation.value;
  //     updatedWorkout = new Cycling(
  //       this.currentWorkout.coords,
  //       distance,
  //       duration,
  //       elevation
  //     );
  //   }

  //   // Find the index of the existing workout in the workouts array
  //   const workoutIndex = this.#workouts.findIndex(
  //     w => w.id === this.currentWorkout.id
  //   );

  //   // Replace the old workout with the updated one
  //   this.#workouts[workoutIndex] = updatedWorkout;

  //   // Update the workout item in the UI
  //   const workoutElement = containerWorkouts.querySelector(
  //     `[data-id="${this.currentWorkout.id}"]`
  //   );

  //   // Update the workout details (distance, duration, etc.) in the UI
  //   workoutElement.querySelector('.workout__title').textContent =
  //     updatedWorkout.description;
  //   workoutElement.querySelector('.workout__value').textContent =
  //     updatedWorkout.distance;
  //   workoutElement.querySelector('.workout__unit').textContent = 'km';
  //   workoutElement.querySelectorAll(
  //     '.workout__details span.workout__value'
  //   )[1].textContent = updatedWorkout.duration;

  //   // If it's a running workout, update the pace and cadence
  //   if (updatedWorkout.type === 'running') {
  //     workoutElement.querySelectorAll(
  //       '.workout__details span.workout__value'
  //     )[2].textContent = updatedWorkout.pace.toFixed(1);
  //     workoutElement.querySelectorAll(
  //       '.workout__details span.workout__value'
  //     )[3].textContent = updatedWorkout.cadence.toFixed(1);
  //   }

  //   // If it's a cycling workout, update the speed and elevation gain
  //   if (updatedWorkout.type === 'cycling') {
  //     workoutElement.querySelectorAll(
  //       '.workout__details span.workout__value'
  //     )[2].textContent = updatedWorkout.speed.toFixed(1);
  //     workoutElement.querySelectorAll(
  //       '.workout__details span.workout__value'
  //     )[3].textContent = updatedWorkout.evaluationGain;
  //   }

  //   // Hide the form
  //   this._hideForm();

  //   // Update localStorage with the updated workouts
  //   this._setLocalStorage();
  // }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.evaluationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveTopPopup(e) {
    let workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;
    console.log(workoutEl);

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel);

    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// console.log(app);
