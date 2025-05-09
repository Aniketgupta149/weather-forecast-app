let weather = {
    apiKey: "67b92f0af5416edbfe58458f502b0a31",
    timeInterval: null,
    fetchWeather: function (city, coords) {
      let url;
      if (coords && coords.lat && coords.lon) {
        url =
          "https://api.openweathermap.org/data/2.5/weather?lat=" +
          coords.lat +
          "&lon=" +
          coords.lon +
          "&units=metric&appid=" +
          this.apiKey;
      } else {
        url =
          "https://api.openweathermap.org/data/2.5/weather?q=" +
          city +
          "&units=metric&appid=" +
          this.apiKey;
      }
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            this.showError("No weather found for '" + (city || "selected location") + "'.");
            throw new Error("No weather found.");
          }
          return response.json();
        })
        .then((data) => {
          this.displayWeather(data);
          if (coords && coords.lat && coords.lon) {
            this.fetchForecast(null, coords);
          } else {
            this.fetchForecast(city);
          }
        })
        .catch((error) => {
          if (error.message !== "No weather found.") {
            this.showError("Unable to fetch weather data.");
          }
        });
    },
    fetchForecast: function (city, coords) {
      let url;
      if (coords && coords.lat && coords.lon) {
        url =
          "https://api.openweathermap.org/data/2.5/forecast?lat=" +
          coords.lat +
          "&lon=" +
          coords.lon +
          "&units=metric&appid=" +
          this.apiKey;
      } else {
        url =
          "https://api.openweathermap.org/data/2.5/forecast?q=" +
          city +
          "&units=metric&appid=" +
          this.apiKey;
      }
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            document.getElementById("forecast-cards").innerHTML =
              "<div style='color:#ff5252;font-weight:600;width:100%;text-align:center;'>No forecast found.</div>";
            throw new Error("No forecast found.");
          }
          return response.json();
        })
        .then((data) => this.displayForecast(data))
        .catch(() => {});
    },
    displayForecast: function (data) {
      const days = {};
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const hour = date.getHours();
        if (!days[day] || Math.abs(hour - 12) < Math.abs(days[day].hour - 12)) {
          days[day] = {
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            desc: item.weather[0].description,
            humidity: item.main.humidity,
            wind: item.wind.speed,
            hour: hour,
            date: date
          };
        }
      });

      const forecastArr = Object.values(days).slice(0, 5);
      const forecastCards = forecastArr
        .map(f =>
          `<div style="flex:1;min-width:140px;max-width:180px;background:rgba(255,255,255,0.13);border-radius:18px;padding:1em 0.5em;margin:0 auto;">
            <div style="font-weight:600;font-size:1.1em;">${f.date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <img src="https://openweathermap.org/img/wn/${f.icon}.png" width="48" alt="${f.desc}">
            <div style="font-size:1.3em;font-weight:700;color:var(--theme-accent);">${f.temp}°C</div>
            <div style="font-size:0.98em;text-transform:capitalize;color:#666;">${f.desc}</div>
            <div style="font-size:0.95em;color:#888;">Humidity: ${f.humidity}%</div>
            <div style="font-size:0.95em;color:#888;">Wind: ${f.wind} km/h</div>
          </div>`
        )
        .join("");
      document.getElementById("forecast-cards").innerHTML = forecastCards;
    },
    displayWeather: function (data) {
      const { name, timezone } = data;
      const { icon, description, main } = data.weather[0];
      const { temp, humidity } = data.main;
      const { speed } = data.wind;
      document.querySelector(".city").innerText = "Weather in " + name;
      if (this.timeInterval) clearInterval(this.timeInterval);
      const cityTimeElem = document.querySelector(".city-time");
      const updateTime = () => {
        const now = new Date();
        const local = new Date(now.getTime() + (timezone * 1000) - (now.getTimezoneOffset() * 60000));
        cityTimeElem.textContent = "Local time: " + local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };
      updateTime();
      this.timeInterval = setInterval(updateTime, 1000);

      document.querySelector(".icon").src =
        "https://openweathermap.org/img/wn/" + icon + ".png";
      document.querySelector(".description").innerText = description;
      document.querySelector(".temp").innerText = temp + "°C";
      document.querySelector(".humidity").innerText =
        "Humidity: " + humidity + "%";
      document.querySelector(".wind").innerText =
        "Wind speed: " + speed + " km/h";
      document.querySelector(".weather").classList.remove("loading");
      this.clearError();

      document.body.classList.remove(
        "weather-clear", "weather-clouds", "weather-rain", "weather-thunderstorm", "weather-snow"
      );
      document.querySelectorAll('.rain-anim, .snow-anim, .sun-rays, .clouds-layer').forEach(e => e.remove());

      let weatherClass = "";
      switch (main.toLowerCase()) {
        case "clear": weatherClass = "weather-clear"; break;
        case "clouds": weatherClass = "weather-clouds"; break;
        case "rain":
        case "drizzle": weatherClass = "weather-rain"; break;
        case "thunderstorm": weatherClass = "weather-thunderstorm"; break;
        case "snow": weatherClass = "weather-snow"; break;
        default: weatherClass = ""; break;
      }
      if (weatherClass) {
        document.body.classList.add("fade-bg");
        document.body.classList.add(weatherClass);
        setTimeout(() => document.body.classList.remove("fade-bg"), 700);
      }

      if (weatherClass === "weather-clear") {
        const rays = document.createElement('div');
        rays.className = 'sun-rays';
        document.body.appendChild(rays);
      }
      if (weatherClass === "weather-clouds") {
        const cloudsBack = document.createElement('div');
        cloudsBack.className = 'clouds-layer back';
        document.body.appendChild(cloudsBack);
        const cloudsFront = document.createElement('div');
        cloudsFront.className = 'clouds-layer front';
        document.body.appendChild(cloudsFront);
      }
      if (weatherClass === "weather-rain") {
        const rainAnim = document.createElement('div');
        rainAnim.className = 'rain-anim';
        for (let i = 0; i < 80; i++) {
          const drop = document.createElement('div');
          drop.className = 'rain-drop';
          if (i % 3 === 0) drop.classList.add('fast');
          if (i % 5 === 0) drop.classList.add('slow');
          drop.style.left = Math.random() * 100 + 'vw';
          drop.style.animationDelay = (Math.random() * 1.2) + 's';
          drop.style.height = (24 + Math.random() * 24) + 'px';
          rainAnim.appendChild(drop);

          if (i % 7 === 0) {
            const splash = document.createElement('div');
            splash.className = 'rain-splash';
            splash.style.left = drop.style.left;
            splash.style.animationDelay = drop.style.animationDelay;
            rainAnim.appendChild(splash);
          }
        }
        document.body.appendChild(rainAnim);
      }
      if (weatherClass === "weather-snow") {
        const snowAnim = document.createElement('div');
        snowAnim.className = 'snow-anim';
        for (let i = 0; i < 50; i++) {
          const flake = document.createElement('div');
          flake.className = 'snow-flake';
          if (i % 3 === 0) flake.classList.add('slow');
          if (i % 5 === 0) flake.classList.add('fast');
          flake.style.left = Math.random() * 100 + 'vw';
          flake.style.animationDelay = (Math.random() * 7) + 's';
          flake.style.width = flake.style.height = (6 + Math.random() * 6) + 'px';
          snowAnim.appendChild(flake);
        }
        document.body.appendChild(snowAnim);
      }
    },
    search: function () {
      this.fetchWeather(document.querySelector(".search-bar").value);
    },
    showError: function (message) {
      let err = document.querySelector(".error-message");
      if (!err) {
        err = document.createElement("div");
        err.className = "error-message";
        document.querySelector(".card").insertBefore(err, document.querySelector(".weather"));
      }
      err.textContent = message;
      document.querySelector(".weather").classList.add("loading");
    },
    clearError: function () {
      let err = document.querySelector(".error-message");
      if (err) err.remove();
    }
  };
  
  document.querySelector(".search button").addEventListener("click", function () {
    weather.search();
  });
  
  document
    .querySelector(".search-bar")
    .addEventListener("keyup", function (event) {
      if (event.key == "Enter") {
        weather.search();
      }
    });
  
  weather.fetchWeather("Patna");

  document.addEventListener("DOMContentLoaded", function () {
    const mapDiv = document.getElementById("map-container");
    if (!mapDiv) return;

    const map = L.map("map-container").setView([25.6, 85.1], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
      maxZoom: 18,
    }).addTo(map);

    let marker = null;

    map.on("click", function (e) {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);

      const resultDiv = document.getElementById("map-weather-result");
      resultDiv.innerHTML = "<div style='color:var(--theme-accent);font-weight:600;'>Loading weather...</div>";

      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=67b92f0af5416edbfe58458f502b0a31`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.cod !== 200) {
            resultDiv.innerHTML = "<div style='color:#ff5252;font-weight:600;'>No weather found for this location.</div>";
            return;
          }
          resultDiv.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;gap:1.5em;flex-wrap:wrap;">
              <div>
                <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" width="64" alt="${data.weather[0].description}">
              </div>
              <div style="text-align:left;">
                <div style="font-size:1.15em;font-weight:600;">${data.name ? data.name + ", " : ""}${data.sys && data.sys.country ? data.sys.country : ""}</div>
                <div style="font-size:1.5em;font-weight:700;color:var(--theme-accent);">${Math.round(data.main.temp)}°C</div>
                <div style="text-transform:capitalize;color:#666;">${data.weather[0].description}</div>
                <div style="font-size:0.98em;color:#888;">Humidity: ${data.main.humidity}%</div>
                <div style="font-size:0.98em;color:#888;">Wind: ${data.wind.speed} km/h</div>
              </div>
            </div>
          `;
          weather.fetchWeather(null, { lat, lon: lng });
        })
        .catch(() => {
          resultDiv.innerHTML = "<div style='color:#ff5252;font-weight:600;'>Unable to fetch weather.</div>";
        });
    });
  });
