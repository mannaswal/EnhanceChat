/**
 * Content script for T3 Chat Enhancer
 * Monitors streaming status and updates favicon accordingly
 */

let isStreaming = false;
let lastStreamingState = false;
let originalFaviconUrl = null;
let hasStreamedBefore = false;
let soundPlayedForCompletion = false;
let currentVolume = 5; // Default volume (5/10 = 50%, will be loaded from storage)
let notificationsEnabled = true; // Default enabled, will be loaded from storage

function startMonitoring() {
	// Delay to avoid false positives on page load
	setTimeout(() => {
		monitorSendButton();
	}, 1500);
}

function monitorSendButton() {
	const checkButtonState = () => {
		const stopButton =
			document.querySelector('button[aria-label="Cancel message"]') ||
			document.querySelector('button[type="button"][aria-label*="Cancel" i]');

		const sendButton =
			document.querySelector(
				'button[type="submit"][aria-label="Send message"]'
			) ||
			document.querySelector('button[type="submit"][aria-label*="Send" i]');

		const input = document.querySelector('textarea, input[type="text"]');
		const hasText = input && input.value.trim().length > 0;

		let streaming = false;

		if (stopButton && stopButton.offsetParent !== null) {
			streaming = true;
		} else if (
			sendButton &&
			sendButton.disabled &&
			hasText &&
			sendButton.offsetParent !== null
		) {
			streaming = true;
		}

		updateStreamingState(streaming);
	};

	checkButtonState();

	const observer = new MutationObserver(checkButtonState);
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['disabled', 'class', 'aria-label', 'title', 'type'],
	});

	let watchedInput = null;
	const inputObserver = new MutationObserver(checkButtonState);

	const watchInput = () => {
		const input = document.querySelector('textarea, input[type="text"]');
		if (input && input !== watchedInput) {
			if (watchedInput) {
				inputObserver.disconnect();
				watchedInput.removeEventListener('input', checkButtonState);
				watchedInput.removeEventListener('change', checkButtonState);
			}

			inputObserver.observe(input, {
				attributes: true,
				attributeFilter: ['value'],
			});

			input.addEventListener('input', checkButtonState);
			input.addEventListener('change', checkButtonState);
			watchedInput = input;
		}
	};

	watchInput();

	const domObserver = new MutationObserver(watchInput);
	domObserver.observe(document.body, {
		childList: true,
		subtree: true,
	});

	setInterval(checkButtonState, 1000);
}

function updateStreamingState(streaming) {
	if (streaming === lastStreamingState) {
		return;
	}

	const wasStreaming = lastStreamingState;
	lastStreamingState = streaming;
	isStreaming = streaming;

	if (streaming) {
		hasStreamedBefore = true;
	}

	if (streaming || hasStreamedBefore) {
		updateFavicon(streaming);
	}

	if (!streaming && wasStreaming) {
		// Only send notification if tab is hidden, notifications are enabled, and we haven't played sound yet
		if (document.hidden && notificationsEnabled && !soundPlayedForCompletion) {
			soundPlayedForCompletion = true;
			chrome.runtime.sendMessage({ type: 'streaming-complete' }, (response) => {
				if (chrome.runtime.lastError) {
					console.error(
						'[T3 Chat Enhancer] Error sending message:',
						chrome.runtime.lastError
					);
				}
			});
		}
	}

	// Reset sound flag when streaming starts again
	if (streaming) {
		soundPlayedForCompletion = false;
	}
}

function init() {
	if (!originalFaviconUrl) {
		getCurrentFavicon();
	}
	// Load volume and enabled state from storage
	chrome.storage.local.get(['volume', 'enabled'], (result) => {
		if (result.volume !== undefined) {
			currentVolume = result.volume;
		}
		if (result.enabled !== undefined) {
			notificationsEnabled = result.enabled;
		}
	});
	startMonitoring();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'ping') {
		sendResponse({ initialized: true, status: 'Running' });
		return true;
	}
	if (message.type === 'set-favicon-state') {
		const state = message.state;
		if (state === 'idle') {
			restoreOriginalFavicon();
		} else if (state === 'streaming') {
			updateFavicon(true);
		} else if (state === 'done') {
			updateFavicon(false);
		}
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'play-sound') {
		playNotificationSoundInPage();
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'set-volume') {
		currentVolume = message.volume;
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'set-enabled') {
		notificationsEnabled = message.enabled;
		sendResponse({ success: true });
		return true;
	}
	return false;
});

function playNotificationSoundInPage() {
	// Don't play sound if notifications are disabled
	if (!notificationsEnabled) {
		return;
	}

	// Convert volume from 0-10 scale to 0-1 scale for audio.volume
	const normalizedVolume = currentVolume / 10;

	const soundUrl = chrome.runtime.getURL('assets/notification.mp3');
	const audio = new Audio(soundUrl);
	audio.volume = normalizedVolume;

	audio.play().catch(() => {
		const wavUrl = chrome.runtime.getURL('assets/notification.wav');
		const fallbackAudio = new Audio(wavUrl);
		fallbackAudio.volume = normalizedVolume;
		fallbackAudio.play().catch((err) => {
			console.error(
				'[T3 Chat Enhancer] Failed to play notification sound:',
				err
			);
		});
	});
}

async function updateFavicon(streaming) {
	try {
		if (streaming) {
			await updateFaviconWithDot('yellow');
		} else {
			await updateFaviconWithDot('green');
		}
	} catch (error) {
		console.error('[T3 Chat Enhancer] Error updating favicon:', error);
	}
}

async function updateFaviconWithDot(color) {
	const size = 32;
	const currentFavicon = getCurrentFavicon();

	if (!currentFavicon) {
		return;
	}

	try {
		const img = await loadImage(currentFavicon);
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');

		// Draw the original favicon
		ctx.drawImage(img, 0, 0, size, size);

		// Calculate dot position and size (absolute corner, no padding)
		const dotRadius = size * 0.18;
		const dotX = size - dotRadius;
		const dotY = size - dotRadius;

		// Draw the colored dot in the hole
		ctx.fillStyle =
			color === 'yellow' ? '#FFC107' : 'oklch(76.5% 0.177 163.223)';
		ctx.beginPath();
		ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
		ctx.fill();

		// Add outline based on system theme
		const isDarkMode = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches;
		ctx.strokeStyle = isDarkMode ? '#3A3A3A' : '#FFFFFF';
		ctx.lineWidth = 2.5;
		ctx.stroke();

		setFavicon(canvas.toDataURL('image/png'));
	} catch (error) {
		console.error('[T3 Chat Enhancer] Error updating favicon:', error);
	}
}

function getCurrentFavicon() {
	if (originalFaviconUrl) {
		return originalFaviconUrl;
	}

	let favicon =
		document.querySelector("link[rel~='icon']") ||
		document.querySelector("link[rel='apple-touch-icon']") ||
		document.querySelector("link[rel='shortcut icon']");

	if (favicon) {
		originalFaviconUrl = favicon.href;
		return favicon.href;
	}

	const defaultFavicon = `${window.location.origin}/favicon.ico`;
	originalFaviconUrl = defaultFavicon;
	return defaultFavicon;
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to load favicon: ${response.status}`);
				}
				return response.blob();
			})
			.then((blob) => {
				const blobUrl = URL.createObjectURL(blob);
				const img = new Image();
				img.onload = () => {
					URL.revokeObjectURL(blobUrl);
					resolve(img);
				};
				img.onerror = () => {
					URL.revokeObjectURL(blobUrl);
					reject(new Error('Failed to load image from blob'));
				};
				img.src = blobUrl;
			})
			.catch(() => {
				// Fallback to direct image loading
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => resolve(img);
				img.onerror = () => {
					const fallbackImg = new Image();
					fallbackImg.onload = () => resolve(fallbackImg);
					fallbackImg.onerror = () =>
						reject(new Error('Failed to load favicon'));
					fallbackImg.src = url;
				};
				img.src = url;
			});
	});
}

function setFavicon(url) {
	document
		.querySelectorAll("link[rel~='icon']")
		.forEach((link) => link.remove());

	const link = document.createElement('link');
	link.rel = 'icon';
	link.type = 'image/png';
	link.href = url;
	document.head.appendChild(link);

	let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
	if (!appleIcon) {
		appleIcon = document.createElement('link');
		appleIcon.rel = 'apple-touch-icon';
		document.head.appendChild(appleIcon);
	}
	appleIcon.href = url;
}

function restoreOriginalFavicon() {
	document
		.querySelectorAll("link[rel~='icon']")
		.forEach((link) => link.remove());

	const faviconUrl =
		originalFaviconUrl || `${window.location.origin}/favicon.ico`;
	const link = document.createElement('link');
	link.rel = 'icon';
	link.href = faviconUrl;
	document.head.appendChild(link);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

document.addEventListener('visibilitychange', () => {
	if (!document.hidden && !isStreaming) {
		restoreOriginalFavicon();
		hasStreamedBefore = false;
		soundPlayedForCompletion = false; // Reset when tab becomes visible
	}
});

let lastUrl = location.href;
new MutationObserver(() => {
	const url = location.href;
	if (url !== lastUrl) {
		lastUrl = url;
		hasStreamedBefore = false;
		lastStreamingState = false;
		isStreaming = false;
		restoreOriginalFavicon();
		setTimeout(init, 1000);
	}
}).observe(document, { subtree: true, childList: true });
