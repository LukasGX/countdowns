// Ab wann der Fortschrittsbalken läuft (nur für erste Zeit)
const startTime = "07:55";

const fixedTimes = ["12:55", "17:00", "19:00"];

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

function createCountdownElement(id, label, showScale = false) {
	const div = document.createElement("div");
	if (showScale) div.className = "countdown-block bd";
	else div.className = "countdown-block";

	let html = `
<div class="time-label">${label}</div>
<div class="time-left ${showScale ? "mm" : ""}" id="time${id}">--:--:--</div>
<div class="bar-container"><div class="bar" id="bar${id}"></div></div>
`;

	if (showScale) {
		const wrapper = document.createElement("div");
		wrapper.className = "progress-scale";

		i = 0;
		while (i <= 100) {
			const tick = document.createElement("div");
			tick.className = "scale-tick";
			tick.style.left = i + "%";

			if (i % 10 === 0) {
				const label = document.createElement("span");
				label.className = "scale-label";
				label.textContent = i + "%";
				if (i === 0) label.classList.add("mvr");
				if (i === 100) label.classList.add("mvl");
				tick.appendChild(label);
			} else if (i % 5 === 0) {
				tick.classList.add("thin");
			} else {
				tick.classList.add("mini");
			}

			wrapper.appendChild(tick);
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

function updateCountdown(id, targetStr, isFixed = false) {
	const now = new Date();
	const startStr = isFixed ? startTime : getProgressStartTime(targetStr);
	const start = getTodayTime(startStr);
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

function buildCountdowns() {
	const containerStatic = document.getElementById("countdowns-static");
	const containerDynamic = document.getElementById("countdowns-dynamic");
	containerStatic.innerHTML = "";
	containerDynamic.innerHTML = "";

	let id = 1;

	// Feste Countdowns (OHNE Skala)
	fixedTimes.forEach((t) => {
		containerStatic.appendChild(
			createCountdownElement(
				id,
				`<span class="type">Feste Zeit</span> <span class="time">${t}</span>`,
				false
			)
		);
		id++;
	});

	// Dynamische Zeit (MIT Skala)
	const nextDyn = getNextDynamicTime();
	containerDynamic.appendChild(
		createCountdownElement(
			id,
			`<span class="type">Dynamisch</span> <span class="time">${nextDyn}</span>`,
			true
		)
	);

	return { dynamicId: id, dynamicTime: nextDyn };
}

function startCountdown() {
	const info = buildCountdowns();

	function updateAll() {
		fixedTimes.forEach((t, i) => updateCountdown(i + 1, t, true));
		updateCountdown(info.dynamicId, info.dynamicTime, false);
	}

	updateAll();
	setInterval(updateAll, 1000);
}

startCountdown();
