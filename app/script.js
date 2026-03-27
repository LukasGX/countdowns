// Ab wann der Fortschrittsbalken läuft (nur für erste Zeit)
const startTime = "07:55";

const fixedTimes = ["12:55", "17:00"];

const allTimes = [
	"08:40",
	"09:25",
	"09:40",
	"10:25",
	"11:10",
	"11:25",
	"12:10",
	"12:55",
	"13:45",
	"14:35",
	"15:20",
	"15:30",
	"16:15",
	"17:00"
];

let customId = 3;

function getTodayTime(hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	const d = new Date();
	d.setHours(h, m, 0, 0);
	return d;
}

function getNextDynamicTime() {
	const now = new Date();
	let lastTime = allTimes[allTimes.length - 1];
	for (const t of allTimes) {
		const target = getTodayTime(t);
		if (target > now) return t;
	}
	return lastTime;
}

function getProgressStartTime(targetStr) {
	const index = allTimes.indexOf(targetStr);
	if (targetStr === allTimes[0]) return startTime;
	if (index > 0) return allTimes[index - 1];
	return startTime;
}

// NEU: Speicherzeitpunkt für Custom zurückgeben
function getCustomStartTime() {
	return localStorage.getItem("customStartTime") || null;
}

function createCountdownElement(
	id,
	label,
	timeContent,
	showScale = false,
	tinyScale = false,
	smallerScale = false
) {
	const div = document.createElement("div");
	if (showScale) div.className = "countdown-block bd";
	else div.className = "countdown-block";

	let html = `
        <div class="time-label">${label}</div>
        <div class="time-display-container" id="time-display${id}">
            ${timeContent}
        </div>
        <div class="time-left" id="time${id}">--:--:--</div>
        <div class="bar-container"><div class="bar" id="bar${id}"></div></div>
    `;

	if (showScale) {
		const wrapper = document.createElement("div");
		wrapper.className = "progress-scale";
		let i = 0;
		while (i <= 100) {
			const tick = document.createElement("div");
			tick.className = "scale-tick";
			if (smallerScale) tick.classList.add("mini");
			tick.style.left = i + "%";

			let add = true;

			if (i % 10 === 0) {
				const labelEl = document.createElement("span");
				labelEl.className = "scale-label";
				labelEl.textContent = i + "%";
				if (i === 0) labelEl.classList.add("mvr");
				if (i === 100) labelEl.classList.add("mvl");
				tick.appendChild(labelEl);
			} else if (i % 5 === 0) {
				if (tinyScale) tick.classList.add("thin");
				else add = false;
			} else {
				if (tinyScale) tick.classList.add("mini");
				else add = false;
			}
			if (add) wrapper.appendChild(tick);
			i += 1;
		}
		html += wrapper.outerHTML;
	}

	div.innerHTML = html;
	return div;
}

function formatTime(diff) {
	const h = Math.floor(diff / 3600000);
	const m = Math.floor((diff % 3600000) / 60000);
	const s = Math.floor((diff % 60000) / 1000);
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Angepasst: Custom verwendet Speicherzeitpunkt
function updateCountdown(id, targetStr, isFixed = false) {
	const now = new Date();

	let startStr, start;

	if (id === customId && !isFixed) {
		// Custom: Von Speicherzeitpunkt aus
		const customStart = getCustomStartTime();
		if (customStart) {
			startStr = customStart;
		} else {
			startStr = startTime; // Fallback falls kein Start gespeichert
		}
	} else {
		// Normale Fixed/Dynamic Logik
		startStr = isFixed ? startTime : getProgressStartTime(targetStr);
	}

	start = getTodayTime(startStr);
	const target = getTodayTime(targetStr);

	const isPast = now >= target;
	const diff = Math.max(target - now, 0);
	const total = target - start;
	let progress = ((now - start) / total) * 100;

	if (isPast) {
		progress = 100;
		document.getElementById("time" + id).textContent = "00:00:00";
	} else {
		document.getElementById("time" + id).textContent = formatTime(diff);
	}

	document.getElementById("bar" + id).style.width =
		Math.min(Math.max(progress, 0), 100) + "%";
}

function createCustomTimeContent() {
	const savedTime = localStorage.getItem("customTime");

	if (savedTime) {
		return `
            <div class="time-display">
                <span class="time">${savedTime}</span>
                <button class="edit-btn" data-time="${savedTime}"><i class="fas fa-edit"></i></button>
            </div>
        `;
	} else {
		return `
            <div class="time-display-container edit-mode">
                <input type="time" id="custom-time" step="60" value="${savedTime || ""}">
                <button id="save-custom"><i class="fas fa-save"></i></button>
            </div>
        `;
	}
}

function buildCountdowns() {
	const containerStatic = document.getElementById("countdowns-static");
	const containerDynamic = document.getElementById("countdowns-dynamic");
	containerStatic.innerHTML = "";
	containerDynamic.innerHTML = "";

	let id = 1;

	// 1. Feste Zeiten
	fixedTimes.forEach((t) => {
		containerStatic.appendChild(
			createCountdownElement(
				id,
				`<span class="type">Feste Zeit</span>`,
				`<div class="time-display"><span class="time">${t}</span></div>`,
				true,
				false,
				true
			)
		);
		id++;
	});

	// 2. Custom Block (immer da - entweder Input oder gespeicherte Zeit)
	const customContent = createCustomTimeContent();
	containerStatic.appendChild(
		createCountdownElement(
			customId,
			`<span class="type">Eigene Zeit</span>`,
			customContent,
			true,
			false,
			true
		)
	);
	id++;

	// 3. Dynamische Zeit
	const nextDyn = getNextDynamicTime();
	containerDynamic.appendChild(
		createCountdownElement(
			id,
			`<span class="type">Dynamisch</span>`,
			`<div class="time-display"><span class="time">${nextDyn}</span></div>`,
			true,
			true,
			false
		)
	);

	// Event Listeners nach Build setzen
	setupCustomEvents();

	return { dynamicId: id, dynamicTime: nextDyn };
}

function setupCustomEvents() {
	const savedTime = localStorage.getItem("customTime");

	// Edit-Button falls gespeichert
	const editBtn = document.querySelector(".edit-btn");
	if (editBtn && savedTime) {
		editBtn.addEventListener("click", () => {
			localStorage.removeItem("customTime");
			localStorage.removeItem("customStartTime"); // Auch Startzeit löschen
			startCountdown();
		});
	}

	// Save-Button falls Edit-Modus
	const saveBtn = document.getElementById("save-custom");
	if (saveBtn) {
		saveBtn.addEventListener("click", () => {
			const newTime = document.getElementById("custom-time").value;
			if (newTime) {
				// **WICHTIG: Speicherzeitpunkt jetzt setzen**
				localStorage.setItem("customTime", newTime);
				localStorage.setItem(
					"customStartTime",
					new Date().toTimeString().slice(0, 5)
				); // Aktuelle HH:MM
				startCountdown();
			}
		});
	}
}

function startCountdown() {
	const info = buildCountdowns();

	function updateAll() {
		// Fixed Times
		fixedTimes.forEach((t, i) => updateCountdown(i + 1, t, true));

		// Custom Time (falls vorhanden)
		const customTime = localStorage.getItem("customTime");
		if (customTime) {
			const now = new Date();
			const target = getTodayTime(customTime);
			if (now < target) {
				updateCountdown(customId, customTime, false); // **false** = Custom-Logik
			} else {
				// Erreicht → 00:00:00 + 100% bis Reload
				document.getElementById("time" + customId).textContent =
					"00:00:00";
				document.getElementById("bar" + customId).style.width = "100%";
			}
		}

		// Dynamic
		updateCountdown(info.dynamicId, info.dynamicTime, false);
	}

	updateAll();
	setInterval(updateAll, 1000);
}

// Start
startCountdown();

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((registration) => {})
			.catch((error) => {});
	});
}
