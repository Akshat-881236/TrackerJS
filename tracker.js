/* =========================================================
   TrackerJS — tracker.js
   Advanced Navigation Intelligence Engine
   Author: Akshat Prasad
   Version: 2.0 Refactored Architecture
   ========================================================= */

(function (window) {
"use strict";

/* =========================================================
   GLOBAL DISABLE
========================================================= */

if (
	localStorage.getItem(
		"__akshat_tracker_disabled__"
	) === "1"
) {
	return;
}

/* =========================================================
   CONFIG
========================================================= */

const DB_NAME = "ANH_TRACKER_DB";

const DB_VERSION = 1;

const STORE_NAME = "logs";

const MAX_LOGS = 300;

/*
   Trusted Network
*/
const TRUSTED_PREFIXES = [

	"https://akshat-881236.github.io/",
	"https://akshat-145609.github.io/",
	"https://itsakshatnetworkhub-881238.github.io/",
	"https://dpgnotes.web.app/"
];

/* =========================================================
   RUNTIME MEMORY
========================================================= */

let CURRENT_LOG_ID = null;

let CONSOLE_ERRORS = [];

let RESOURCE_ERRORS = [];

let NETWORK_ERRORS = [];

let REDIRECT_TARGET = null;

/* =========================================================
   URL UTIL
========================================================= */

function normalizeURL(url) {

	try {

		url = url.split("#")[0];

		return url.replace(/\/+$/, "/");

	} catch {

		return url;
	}
}

function isTrusted(url) {

	url = normalizeURL(url);

	for (
		let i = 0;
		i < TRUSTED_PREFIXES.length;
		i++
	) {

		const prefix =
			normalizeURL(
				TRUSTED_PREFIXES[i]
			);

		if (url.indexOf(prefix) === 0) {

			return true;
		}
	}

	return false;
}

/* =========================================================
   PAGE INFO
========================================================= */

function getPageInfo() {

	const url =
		new URL(location.href);

	return {

		url: location.href,

		origin: location.origin,

		pathname: location.pathname,

		search: location.search,

		hash: location.hash,

		title: document.title ||

			"Untitled Page",

		referrer: document.referrer ||

			null,

		userAgent:
			navigator.userAgent,

		language:
			navigator.language,

		online:
			navigator.onLine,

		screen: {

			width: screen.width,

			height: screen.height
		},

		viewport: {

			width: innerWidth,

			height: innerHeight
		},

		deviceMemory:
			navigator.deviceMemory ||

			null,

		hardwareConcurrency:
			navigator.hardwareConcurrency ||

			null,

		timezone:
			Intl.DateTimeFormat()
			.resolvedOptions()
			.timeZone,

		cookiesEnabled:
			navigator.cookieEnabled,

		timestamp:
			new Date().toISOString(),

		paramCount:
			Array.from(
				url.searchParams.keys()
			).length,

		params:
			Object.fromEntries(
				url.searchParams.entries()
			)
	};
}

/* =========================================================
   PARAM ANALYSIS
========================================================= */

function analyzeParams() {

	const url =
		new URL(location.href);

	const params =
		Object.fromEntries(
			url.searchParams.entries()
		);

	const report = {

		hasParams: false,

		paramKeys: [],

		utmDetected: false,

		possibleTracking: false,

		paramEffects: []
	};

	const keys =
		Object.keys(params);

	if (keys.length > 0) {

		report.hasParams = true;

		report.paramKeys = keys;
	}

	keys.forEach(key => {

		const lower =
			key.toLowerCase();

		if (
			lower.startsWith("utm_")
		) {

			report.utmDetected =
				true;
		}

		if (
			lower.includes("ref") ||
			lower.includes("source") ||
			lower.includes("campaign")
		) {

			report.possibleTracking =
				true;
		}

		report.paramEffects.push({

			param: key,

			value: params[key],

			length:
				String(params[key])
				.length
		});
	});

	return report;
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDB() {

	return new Promise(
		(resolve, reject) => {

		const request =
			indexedDB.open(
				DB_NAME,
				DB_VERSION
			);

		request.onupgradeneeded =
			function (e) {

			const db =
				e.target.result;

			if (
				!db.objectStoreNames
				.contains(STORE_NAME)
			) {

				const store =
					db.createObjectStore(
						STORE_NAME,
						{
							keyPath: "id",
							autoIncrement: true
						}
					);

				store.createIndex(
					"url",
					"url",
					{ unique: false }
				);

				store.createIndex(
					"timestamp",
					"timestamp",
					{ unique: false }
				);
			}
		};

		request.onsuccess =
			function (e) {

			resolve(
				e.target.result
			);
		};

		request.onerror =
			function () {

			reject(
				"IndexedDB Error"
			);
		};
	});
}

/* =========================================================
   CONSOLE TRACKING
========================================================= */

(function patchConsole() {

	const originalError =
		console.error;

	console.error =
		function () {

		CONSOLE_ERRORS.push({

			type: "console.error",

			args:
				Array.from(arguments),

			time:
				Date.now()
		});

		originalError.apply(
			console,
			arguments
		);
	};

	const originalWarn =
		console.warn;

	console.warn =
		function () {

		CONSOLE_ERRORS.push({

			type: "console.warn",

			args:
				Array.from(arguments),

			time:
				Date.now()
		});

		originalWarn.apply(
			console,
			arguments
		);
	};

})();

/* =========================================================
   RESOURCE ERROR TRACKING
========================================================= */

window.addEventListener(
	"error",
	function (event) {

		if (event.target) {

			const tag =
				event.target.tagName;

			if (
				tag === "IMG" ||
				tag === "SCRIPT" ||
				tag === "LINK"
			) {

				RESOURCE_ERRORS.push({

					tag: tag,

					source:
						event.target.src ||
						event.target.href,

					time:
						Date.now()
				});
			}
		}

	},
	true
);

/* =========================================================
   FETCH TRACKING
========================================================= */

(function patchFetch() {

	if (!window.fetch) return;

	const originalFetch =
		window.fetch;

	window.fetch =
		async function () {

		try {

			const response =
				await originalFetch.apply(
					this,
					arguments
				);

			if (!response.ok) {

				NETWORK_ERRORS.push({

					url:
						response.url,

					status:
						response.status,

					statusText:
						response.statusText,

					time:
						Date.now()
				});
			}

			return response;

		} catch (err) {

			NETWORK_ERRORS.push({

				type:
					"fetch_failure",

				error:
					String(err),

				time:
					Date.now()
			});

			throw err;
		}
	};

})();

/* =========================================================
   NAVIGATION TRACKING
========================================================= */

function buildRedirectURL(target) {

	try {

		const url =
			new URL(target);

		url.searchParams.set(
			"anh_prev_url",
			location.href
		);

		url.searchParams.set(
			"anh_prev_log_id",
			CURRENT_LOG_ID || "0"
		);

		url.searchParams.set(
			"utm_source",
			"ANH_TrackerJS"
		);

		url.searchParams.set(
			"utm_medium",
			"navigation"
		);

		url.searchParams.set(
			"utm_campaign",
			"cross_page_tracking"
		);

		return url.toString();

	} catch {

		return target;
	}
}

/* =========================================================
   SAFE REDIRECT
========================================================= */

function redirectWithTracker(url){

	try{

		url =
			buildRedirectURL(url);

		REDIRECT_TARGET =
			url;

		window.location.href =
			url;

	}catch(err){

		console.error(
			"Tracker Redirect Error",
			err
		);

		window.location.href =
			url;
	}
}

/*
   Public API
*/
window.TrackerRedirect =
	redirectWithTracker;

/* =========================================================
   LINK INTERCEPTION
========================================================= */

document.addEventListener(
	"click",
	function (event) {

		const anchor =
			event.target.closest("a");

		if (!anchor) return;

		const href =
			anchor.getAttribute("href");

		if (
			!href ||
			href.startsWith("#") ||
			href.startsWith("mailto:") ||
			href.startsWith("tel:")
		) {
			return;
		}

		try {

			const full =
				new URL(
					href,
					location.href
				);

			REDIRECT_TARGET =
				full.href;

			anchor.href =
				buildRedirectURL(
					full.href
				);

		} catch {}

	},
	true
);

/* =========================================================
   SAFE NAVIGATION INTERCEPTOR
========================================================= */

function redirectWithTracker(url){

	try{

		url =
			buildRedirectURL(url);

		REDIRECT_TARGET =
			url;

		window.location.href =
			url;

	}catch(err){

		console.error(
			"Tracker Redirect Error",
			err
		);

		window.location.href =
			url;
	}
}

/*
   Public helper
*/
window.TrackerRedirect =
	redirectWithTracker;
	
/* =========================================================
   DIAGNOSIS REPORT
========================================================= */

function buildDiagnosis() {

	const navigation =
		performance.getEntriesByType(
			"navigation"
		)[0];

	return {

		httpStatus:
			200,

		pageLoadTime:
			navigation ?

			Math.round(
				navigation.duration
			) : null,

		domComplete:
			navigation ?

			Math.round(
				navigation.domComplete
			) : null,

		redirectCount:
			navigation ?

			navigation.redirectCount
			: 0,

		resourceErrors:
			RESOURCE_ERRORS,

		consoleErrors:
			CONSOLE_ERRORS,

		networkErrors:
			NETWORK_ERRORS,

		memory:

			performance.memory ?

			{

				jsHeapSizeLimit:
					performance.memory
					.jsHeapSizeLimit,

				totalJSHeapSize:
					performance.memory
					.totalJSHeapSize,

				usedJSHeapSize:
					performance.memory
					.usedJSHeapSize

			} : null,

		connection:

			navigator.connection ?

			{

				effectiveType:
					navigator.connection
					.effectiveType,

				downlink:
					navigator.connection
					.downlink,

				rtt:
					navigator.connection
					.rtt

			} : null
	};
}

/* =========================================================
   STORE LOG
========================================================= */

async function storeLog() {

	if (!isTrusted(location.href)) {
		return;
	}

	const db =
		await openDB();

	const tx =
		db.transaction(
			STORE_NAME,
			"readwrite"
		);

	const store =
		tx.objectStore(STORE_NAME);

	const pageInfo =
		getPageInfo();

	const diagnosis =
		buildDiagnosis();

	const params =
		analyzeParams();

	const log = {

		url:
			pageInfo.url,

		title:
			pageInfo.title,

		timestamp:
			pageInfo.timestamp,

		pageInfo:
			pageInfo,

		paramAnalysis:
			params,

		diagnosis:
			diagnosis,

		redirectTarget:
			REDIRECT_TARGET,

		previousLogId:
			pageInfo.params
			.anh_prev_log_id ||

			null,

		previousURL:
			pageInfo.params
			.anh_prev_url ||

			null,

		trusted:
			true
	};

	const request =
		store.add(log);

	request.onsuccess =
		function (e) {

		CURRENT_LOG_ID =
			e.target.result;

		cleanupLogs();
	};
}

/* =========================================================
   CLEANUP
========================================================= */

async function cleanupLogs() {

	const db =
		await openDB();

	const tx =
		db.transaction(
			STORE_NAME,
			"readwrite"
		);

	const store =
		tx.objectStore(STORE_NAME);

	const request =
		store.getAll();

	request.onsuccess =
		function () {

		const data =
			request.result || [];

		if (
			data.length <= MAX_LOGS
		) {
			return;
		}

		data.sort(
			(a, b) => {

			return new Date(a.timestamp)
				-
				new Date(b.timestamp);

		});

		const remove =
			data.slice(
				0,
				data.length - MAX_LOGS
			);

		remove.forEach(item => {

			store.delete(item.id);
		});
	};
}

/* =========================================================
   PUBLIC API
========================================================= */

window.TrackerJS = {

	DB_NAME:
		DB_NAME,

	STORE_NAME:
		STORE_NAME,

	openDB,

	storeLog,

	getLogs:
		async function(){

		const db =
			await openDB();

		return new Promise(
			resolve=>{

			const tx =
				db.transaction(
					STORE_NAME,
					"readonly"
				);

			const store =
				tx.objectStore(
					STORE_NAME
				);

			const request =
				store.getAll();

			request.onsuccess =
				function(){

				resolve(
					request.result || []
				);
			};
		});
	},

	getLogById:
		async function(id){

		const db =
			await openDB();

		return new Promise(
			resolve=>{

			const tx =
				db.transaction(
					STORE_NAME,
					"readonly"
				);

			const store =
				tx.objectStore(
					STORE_NAME
				);

			const request =
				store.get(id);

			request.onsuccess =
				function(){

				resolve(
					request.result || null
				);
			};
		});
	},

	deleteLog:
		async function(id){

		const db =
			await openDB();

		const tx =
			db.transaction(
				STORE_NAME,
				"readwrite"
			);

		tx.objectStore(
			STORE_NAME
		).delete(id);
	},

	clearLogs:
		async function(){

		const db =
			await openDB();

		const tx =
			db.transaction(
				STORE_NAME,
				"readwrite"
			);

		tx.objectStore(
			STORE_NAME
		).clear();
	}
};
