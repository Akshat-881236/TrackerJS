/* =========================================================
   TrackerJS — index.js
   Smart Visit Resume Engine
   Author: Akshat Prasad
   ========================================================= */

(function (window) {
"use strict";

/* =========================================================
   CONFIG
========================================================= */

const DB_NAME = "TrackerJS_DB";
const STORE_NAME = "visit_history";

const MAX_ENTRIES = 50;

/*
   Duplicate prevention
   Same page won't be stored again
   within 2 hours
*/
const DUPLICATE_BLOCK_HOURS = 2;

/*
   Allowed secure domains
*/
const TRUSTED_PREFIXES = [

	"https://akshat-881236.github.io/",
	"https://akshat-145609.github.io/",
	"https://itsakshatnetworkhub-881238.github.io/",

	/* DPG Notes FULL WEBSITE */
	"https://dpgnotes.web.app/"
];

/*
   Exact secure pages only
*/
const TRUSTED_EXACT = [
	/*
	   Example:
	   "https://example.com/page.html"
	*/
];

/* =========================================================
   UTIL
========================================================= */

function normalizeURL(url) {

	try {

		/*
		   Remove hash fragments
		*/
		url = url.split("#")[0];

		/*
		   Normalize trailing slash
		*/
		return url.replace(/\/+$/, "/");

	} catch {

		return url;
	}
}

function isTrusted(url) {

	url = normalizeURL(url);

	/* PREFIX DOMAINS */
	for (let i = 0; i < TRUSTED_PREFIXES.length; i++) {

		let trustedPrefix =
			normalizeURL(TRUSTED_PREFIXES[i]);

		if (url.indexOf(trustedPrefix) === 0) {

			return true;
		}
	}

	/* EXACT PAGES */
	for (let j = 0; j < TRUSTED_EXACT.length; j++) {

		let exact =
			normalizeURL(TRUSTED_EXACT[j]);

		if (url === exact) {

			return true;
		}
	}

	return false;
}

function getMetaDescription() {

	let meta = document.querySelector(
		'meta[name="description"]'
	);

	return meta ? meta.content.trim() : "No description available.";
}

function now() {
	return Date.now();
}

function hoursBetween(a, b) {
	return Math.abs(a - b) / (1000 * 60 * 60);
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDB() {

	return new Promise((resolve, reject) => {

		const request = indexedDB.open(DB_NAME, 1);

		request.onupgradeneeded = function (e) {

			const db = e.target.result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {

				db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true
				});
			}
		};

		request.onsuccess = function (e) {
			resolve(e.target.result);
		};

		request.onerror = function () {
			reject("IndexedDB failed");
		};
	});
}

/* =========================================================
   SAVE VISIT
========================================================= */

async function saveVisit() {

	if (!isTrusted(location.href)) return;

	const db = await openDB();

	const tx = db.transaction(STORE_NAME, "readwrite");

	const store = tx.objectStore(STORE_NAME);

	const request = store.getAll();

	request.onsuccess = function () {

		let data = request.result || [];

		let currentURL = location.href;

		/*
		   Duplicate prevention
		*/
		let duplicate = data.find(item => {

			return (
				item.url === currentURL &&
				hoursBetween(now(), item.time) <
				DUPLICATE_BLOCK_HOURS
			);

		});

		if (duplicate) return;

		/*
		   Create visit entry
		*/
		let entry = {

			url: currentURL,

			title: document.title || "Untitled Page",

			description: getMetaDescription(),

			time: now()
		};

		store.add(entry);

		/*
		   Limit entries
		*/
		if (data.length > MAX_ENTRIES) {

			data.sort((a, b) => a.time - b.time);

			store.delete(data[0].id);
		}
	};
}

/* =========================================================
   GET PREVIOUS VISIT
========================================================= */

async function getPreviousVisit() {

	const db = await openDB();

	return new Promise((resolve) => {

		const tx = db.transaction(STORE_NAME, "readonly");

		const store = tx.objectStore(STORE_NAME);

		const request = store.getAll();

		request.onsuccess = function () {

			let data = request.result || [];

			/*
			   Sort newest first
			*/
			data.sort((a, b) => b.time - a.time);

			/*
			   Find previous page
			*/
			let current = location.href;

			let previous = data.find(item => item.url !== current);

			resolve(previous || null);
		};
	});
}

/* =========================================================
   UI CARD
========================================================= */

function createCard(data) {

	if (!data) return;

	/*
	   Prevent duplicate popup
	*/
	if (document.getElementById("trackerjs-card")) {
		return;
	}

	const overlay = document.createElement("div");

	overlay.id = "trackerjs-card";

	overlay.innerHTML = `

<style>

#trackerjs-overlay{

	position:fixed;
	inset:0;
	background:rgba(0,0,0,.45);

	z-index:99999999;

	display:flex;
	align-items:center;
	justify-content:center;

	padding:18px;

	backdrop-filter:blur(6px);
}

#trackerjs-box{

	width:min(95vw,420px);

	background:#fff;

	border-radius:22px;

	padding:24px;

	font-family:system-ui,Arial;

	box-shadow:
	0 10px 40px rgba(0,0,0,.25);

	animation:trackerFade .35s ease;
}

@keyframes trackerFade{

	from{
		opacity:0;
		transform:translateY(20px) scale(.95);
	}

	to{
		opacity:1;
		transform:translateY(0) scale(1);
	}
}

#trackerjs-top{

	display:flex;
	align-items:center;
	justify-content:space-between;

	margin-bottom:18px;
}

#trackerjs-title{

	font-size:20px;
	font-weight:700;
	color:#111;
}

#trackerjs-close{

	border:none;
	background:none;

	font-size:24px;

	cursor:pointer;

	color:#777;
}

#trackerjs-project{

	font-size:18px;
	font-weight:700;

	margin-bottom:10px;

	color:#1e1e1e;
}

#trackerjs-desc{

	font-size:14px;
	line-height:1.7;

	color:#555;

	margin-bottom:22px;

	max-height:120px;
	overflow:auto;
}

#trackerjs-question{

	font-size:14px;
	font-weight:600;

	color:#222;

	margin-bottom:20px;
}

#trackerjs-actions{

	display:flex;
	gap:12px;
	flex-wrap:wrap;
}

.tracker-btn{

	flex:1;

	min-width:120px;

	padding:13px 16px;

	border:none;

	border-radius:12px;

	font-size:14px;

	font-weight:700;

	cursor:pointer;

	transition:.25s;
}

#trackerjs-continue{

	background:#1e8e3e;
	color:#fff;
}

#trackerjs-continue:hover{

	transform:translateY(-2px);
}

#trackerjs-stay{

	background:#f1f3f4;
	color:#222;
}

#trackerjs-stay:hover{

	background:#e5e7eb;
}

/* Mobile */
@media(max-width:600px){

	#trackerjs-box{

		padding:20px;
		border-radius:18px;
	}

	#trackerjs-title{

		font-size:18px;
	}

	#trackerjs-project{

		font-size:16px;
	}
}

</style>

<div id="trackerjs-overlay">

	<div id="trackerjs-box">

		<div id="trackerjs-top">

			<div id="trackerjs-title">
				You Previously Visit
			</div>

			<button id="trackerjs-close">
				×
			</button>

		</div>

		<div id="trackerjs-project">
			${escapeHTML(data.title)}
		</div>

		<div id="trackerjs-desc">
			${escapeHTML(data.description)}
		</div>

		<div id="trackerjs-question">

			Would you like to continue to where
			you leave last time or still want to
			stay here ?

		</div>

		<div id="trackerjs-actions">

			<button
				class="tracker-btn"
				id="trackerjs-continue">

				Continue

			</button>

			<button
				class="tracker-btn"
				id="trackerjs-stay">

				Stay

			</button>

		</div>

	</div>

</div>
`;

	document.body.appendChild(overlay);

	/*
	   Stay / Close
	*/
	function closeCard() {

		overlay.remove();
	}

	document
	.getElementById("trackerjs-stay")
	.addEventListener("click", closeCard);

	document
	.getElementById("trackerjs-close")
	.addEventListener("click", closeCard);

	/*
	   Continue
	*/
	document
	.getElementById("trackerjs-continue")
	.addEventListener("click", function () {

		location.href = data.url;
	});
}

/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(str) {

	if (!str) return "";

	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/* =========================================================
   INIT
========================================================= */

async function initTrackerJS() {

	/*
	   Only on trusted domains
	*/
	if (!isTrusted(location.href)) {
		return;
	}

	/*
	   Get previous page
	*/
	let previous = await getPreviousVisit();

	/*
	   Save current page
	*/
	await saveVisit();

	/*
	   Show card
	*/
	if (previous) {

		setTimeout(function () {

			createCard(previous);

		}, CARD_DELAY);
	}
}

/* =========================================================
   START
========================================================= */

document.addEventListener(
	"DOMContentLoaded",
	initTrackerJS
);

})(window);