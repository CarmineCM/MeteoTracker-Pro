/* ── Weather data ────────────────────────────────────── */

const WEATHER = {
    0:  { label: "Cielo sereno",           icon: "☀️" },
    1:  { label: "Prevalentemente sereno", icon: "🌤️" },
    2:  { label: "Parzialmente nuvoloso",  icon: "⛅" },
    3:  { label: "Coperto",                icon: "☁️" },
    45: { label: "Nebbia",                 icon: "🌫️" },
    48: { label: "Nebbia con brina",       icon: "🌫️" },
    51: { label: "Pioviggine leggera",     icon: "🌦️" },
    53: { label: "Pioviggine moderata",    icon: "🌧️" },
    55: { label: "Pioviggine intensa",     icon: "🌧️" },
    56: { label: "Pioviggine gelata",      icon: "🌨️" },
    57: { label: "Pioviggine gelata int.", icon: "🌨️" },
    61: { label: "Pioggia leggera",        icon: "🌧️" },
    63: { label: "Pioggia moderata",       icon: "🌧️" },
    65: { label: "Pioggia intensa",        icon: "🌧️" },
    66: { label: "Pioggia gelata",         icon: "🌨️" },
    67: { label: "Pioggia gelata int.",    icon: "🌨️" },
    71: { label: "Neve leggera",           icon: "🌨️" },
    73: { label: "Neve moderata",          icon: "❄️" },
    75: { label: "Neve intensa",           icon: "❄️" },
    77: { label: "Granelli di neve",       icon: "❄️" },
    80: { label: "Rovescio leggero",       icon: "🌦️" },
    81: { label: "Rovescio moderato",      icon: "🌧️" },
    82: { label: "Rovescio intenso",       icon: "⛈️" },
    85: { label: "Rovescio di neve",       icon: "🌨️" },
    86: { label: "Rovescio neve int.",     icon: "❄️" },
    95: { label: "Temporale",              icon: "⛈️" },
    96: { label: "Temporale con grandine", icon: "⛈️" },
    99: { label: "Temporale forte",        icon: "⛈️" },
};

/* ── Cache ───────────────────────────────────────────── */

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
    return entry.data;
}

function setCached(key, data) {
    cache.set(key, { ts: Date.now(), data });
}

/* ── API ─────────────────────────────────────────────── */

async function fetchWeather(cityName, days = 7) {
    const key = `${cityName.trim().toLowerCase()}_${days}`;
    const cached = getCached(key);
    if (cached) return cached;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=it&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Errore nella richiesta di geocoding.");

    const geoData = await geoRes.json();
    if (!geoData.results?.length) throw new Error("Città non trovata. Riprova con un altro nome.");

    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast`
        + `?latitude=${latitude}&longitude=${longitude}`
        + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max,sunrise,sunset`
        + `&hourly=temperature_2m,precipitation_probability,windspeed_10m`
        + `&timezone=auto&forecast_days=${days}`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("Errore nel recupero dei dati meteo.");

    const w = await weatherRes.json();
    if (!w.daily) throw new Error("Dati meteo non disponibili per questa città.");

    // Group hourly slots by date
    const hourlyByDate = {};
    w.hourly.time.forEach((t, i) => {
        const [date, timePart] = t.split("T");
        const hour = parseInt(timePart, 10);
        if (!hourlyByDate[date]) hourlyByDate[date] = [];
        hourlyByDate[date].push({
            hour,
            temp:       Math.round(w.hourly.temperature_2m[i]),
            precipProb: Math.round(w.hourly.precipitation_probability?.[i] ?? 0),
            wind:       Math.round(w.hourly.windspeed_10m?.[i] ?? 0),
        });
    });

    const fmtTime = iso => iso ? iso.split("T")[1]?.slice(0, 5) : "—";

    const result = {
        city: name,
        country,
        forecasts: w.daily.time.map((date, i) => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString("it-IT", { weekday: "short" });
            const dayDate = dateObj.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
            const code    = w.daily.weathercode[i];
            return {
                date,
                dateStr:     `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayDate}`,
                isToday:     i === 0,
                max_temp:    w.daily.temperature_2m_max[i],
                min_temp:    w.daily.temperature_2m_min[i],
                icon:        WEATHER[code]?.icon ?? "🌡️",
                description: WEATHER[code]?.label ?? "Sconosciuto",
                precip:      Math.round(w.daily.precipitation_sum?.[i] ?? 0),
                windMax:     Math.round(w.daily.windspeed_10m_max?.[i] ?? 0),
                uvIndex:     Math.round(w.daily.uv_index_max?.[i] ?? 0),
                sunrise:     fmtTime(w.daily.sunrise?.[i]),
                sunset:      fmtTime(w.daily.sunset?.[i]),
                hourly:      hourlyByDate[date] ?? [],
            };
        }),
    };

    setCached(key, result);
    return result;
}

/* ── DOM helpers ─────────────────────────────────────── */

function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    children.forEach(c => node.append(c));
    return node;
}

function statBox(label, value, unit = "") {
    return el("div", { className: "detail-stat" }, [
        el("span", { className: "detail-stat-value", textContent: value + unit }),
        el("span", { className: "detail-stat-label", textContent: label }),
    ]);
}

function uvBadge(uv) {
    const level = uv <= 2 ? "Basso" : uv <= 5 ? "Moderato" : uv <= 7 ? "Alto" : "Molto alto";
    const cls   = uv <= 2 ? "uv-low" : uv <= 5 ? "uv-mod"  : uv <= 7 ? "uv-high" : "uv-vhigh";
    return el("span", { className: `uv-badge ${cls}`, textContent: `☀️ UV ${uv} — ${level}` });
}

function buildHourlyRow(h) {
    const row = el("div", { className: "hourly-row" });
    row.append(
        el("span", { className: "h-hour",   textContent: `${String(h.hour).padStart(2, "0")}:00` }),
        el("span", { className: "h-temp",   textContent: `${h.temp}°` }),
        el("span", { className: "h-precip", textContent: `💧 ${h.precipProb}%` }),
        el("span", { className: "h-wind",   textContent: `💨 ${h.wind} km/h` }),
    );
    return row;
}

function buildDetail(forecast) {
    const panel = el("div", { className: "detail-panel" });

    const statsRow = el("div", { className: "detail-stats" });
    statsRow.append(
        statBox("Precipitazioni", forecast.precip, " mm"),
        statBox("Vento max",      forecast.windMax, " km/h"),
        statBox("Alba",           forecast.sunrise),
        statBox("Tramonto",       forecast.sunset),
    );
    panel.appendChild(statsRow);
    panel.appendChild(uvBadge(forecast.uvIndex));

    if (forecast.hourly.length) {
        panel.appendChild(el("p", { className: "hourly-title", textContent: "Andamento orario" }));
        const list = el("div", { className: "hourly-list" });
        forecast.hourly
            .filter(h => h.hour % 3 === 0)
            .forEach(h => list.appendChild(buildHourlyRow(h)));
        panel.appendChild(list);
    }

    return panel;
}

function buildCard(forecast, index) {
    const card = el("article", {
        className: `forecast-card${forecast.isToday ? " today" : ""}`,
        role:      "button",
        tabIndex:  0,
        "aria-expanded": "false",
        "aria-label": `${forecast.isToday ? "Oggi" : forecast.dateStr}: ${forecast.description}. Clicca per i dettagli.`,
    });
    card.style.animationDelay = `${index * 0.05}s`;

    // Summary
    const summary = el("div", { className: "card-summary" });
    const tempsEl = el("div", { className: "temps" }, [
        el("span", { className: "max", textContent: `${Math.round(forecast.max_temp)}°`, title: "Massima" }),
        el("span", { className: "min", textContent: `${Math.round(forecast.min_temp)}°`, title: "Minima" }),
    ]);
    summary.append(
        el("div",  { className: "date",         textContent: forecast.isToday ? "Oggi" : forecast.dateStr }),
        el("span", { className: "weather-icon", textContent: forecast.icon }),
        el("div",  { className: "desc",         textContent: forecast.description }),
        tempsEl,
        el("span", { className: "chevron",      textContent: "›" }),
    );

    // Detail (collapsed)
    const detail = buildDetail(forecast);
    detail.classList.add("detail-hidden");

    card.append(summary, detail);

    function toggle(e) {
        e.stopPropagation();
        const open = card.classList.toggle("expanded");
        card.setAttribute("aria-expanded", String(open));
        detail.classList.toggle("detail-hidden", !open);

        // Collapse siblings
        if (open) {
            card.closest(".forecast-container")
                ?.querySelectorAll(".forecast-card.expanded")
                .forEach(c => { if (c !== card) { c.classList.remove("expanded"); c.setAttribute("aria-expanded","false"); c.querySelector(".detail-panel")?.classList.add("detail-hidden"); } });
        }
    }

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } });

    return card;
}

/* ── Autocomplete ────────────────────────────────────── */

async function fetchSuggestions(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=it&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
}

function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

/* ── UI controller ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    const cityInput     = document.getElementById("cityInput");
    const searchBtn     = document.getElementById("searchBtn");
    const loading       = document.getElementById("loading");
    const errorBox      = document.getElementById("errorBox");
    const weatherResult = document.getElementById("weatherResult");
    const cityNameEl    = document.getElementById("cityName");
    const countryEl     = document.getElementById("countryCode");
    const forecastEl    = document.getElementById("forecastCards");

    /* ── Dropdown ── */
    const dropdown = el("ul", { id: "suggestions", className: "suggestions hidden", role: "listbox", "aria-label": "Suggerimenti città" });
    cityInput.parentElement.parentElement.appendChild(dropdown);

    let activeIndex = -1;
    let currentSuggestions = [];

    function showDropdown(items) {
        currentSuggestions = items;
        activeIndex = -1;
        dropdown.innerHTML = "";
        if (!items.length) { dropdown.classList.add("hidden"); return; }

        items.forEach((city, i) => {
            const li = el("li", { role: "option", "aria-selected": "false", className: "suggestion-item" });
            li.append(
                el("span", { className: "sug-name", textContent: city.name }),
                el("span", { className: "sug-meta", textContent: [city.admin1, city.country].filter(Boolean).join(", ") }),
            );
            li.addEventListener("mousedown", e => { e.preventDefault(); selectSuggestion(i); });
            dropdown.appendChild(li);
        });
        dropdown.classList.remove("hidden");
    }

    function hideDropdown() { dropdown.classList.add("hidden"); activeIndex = -1; }

    function setActive(index) {
        dropdown.querySelectorAll(".suggestion-item").forEach((li, i) => {
            const a = i === index;
            li.classList.toggle("active", a);
            li.setAttribute("aria-selected", a ? "true" : "false");
        });
        activeIndex = index;
    }

    function selectSuggestion(index) {
        const city = currentSuggestions[index];
        if (!city) return;
        cityInput.value = city.name;
        hideDropdown();
        handleSearch();
    }

    const onInput = debounce(async () => {
        const q = cityInput.value.trim();
        if (q.length < 2) { hideDropdown(); return; }
        showDropdown(await fetchSuggestions(q));
    }, 250);

    cityInput.addEventListener("input", onInput);
    cityInput.addEventListener("keydown", e => {
        const items = dropdown.querySelectorAll(".suggestion-item");
        if (!items.length || dropdown.classList.contains("hidden")) return;
        if (e.key === "ArrowDown")               { e.preventDefault(); setActive(Math.min(activeIndex + 1, items.length - 1)); }
        else if (e.key === "ArrowUp")            { e.preventDefault(); setActive(Math.max(activeIndex - 1, 0)); }
        else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); selectSuggestion(activeIndex); }
        else if (e.key === "Escape")             { hideDropdown(); }
    });
    document.addEventListener("click", e => {
        if (!dropdown.contains(e.target) && e.target !== cityInput) hideDropdown();
    });

    /* ── Core UI ── */
    function setLoading(active) {
        loading.classList.toggle("hidden", !active);
        searchBtn.disabled = active;
    }

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove("hidden");
    }

    function resetUI() {
        errorBox.classList.add("hidden");
        weatherResult.classList.add("hidden");
        forecastEl.innerHTML = "";
    }

    async function handleSearch() {
        const city = cityInput.value.trim();
        if (!city) return;
        hideDropdown();
        resetUI();
        setLoading(true);
        try {
            const data = await fetchWeather(city, 7);
            cityNameEl.textContent = data.city;
            countryEl.textContent  = data.country;
            const fragment = document.createDocumentFragment();
            data.forecasts.forEach((f, i) => fragment.appendChild(buildCard(f, i)));
            forecastEl.appendChild(fragment);
            weatherResult.classList.remove("hidden");
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    }

    searchBtn.addEventListener("click", handleSearch);
    cityInput.addEventListener("keypress", e => { if (e.key === "Enter" && activeIndex < 0) handleSearch(); });
    cityInput.focus();
});
