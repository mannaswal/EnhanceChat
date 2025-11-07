/**
 * Background service worker for T3 Chat Enhancer
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'streaming-complete') {
		// Only play sound in the specific tab that finished streaming
		if (sender.tab && sender.tab.id) {
			playNotificationSound(sender.tab.id).catch((err) => {
				console.error('[T3 Chat Enhancer] Error playing sound:', err);
			});
		}
		sendResponse({ success: true });
		return false;
	}
	if (message.type === 'test-sound') {
		// For test sound, play in all tabs (user-initiated)
		playNotificationSound().catch((err) => {
			console.error('[T3 Chat Enhancer] Error playing sound:', err);
		});
		sendResponse({ success: true });
		return false;
	}
	if (message.type === 'set-volume' || message.type === 'set-enabled') {
		// Forward volume/enabled settings to all T3 Chat tabs
		forwardMessageToTabs(message).catch((err) => {
			console.error('[T3 Chat Enhancer] Error forwarding message:', err);
		});
		sendResponse({ success: true });
		return false;
	}
	return false;
});

async function playNotificationSound(targetTabId = null) {
	try {
		if (targetTabId) {
			// Play sound only in the specific tab
			chrome.tabs.sendMessage(targetTabId, { type: 'play-sound' }, () => {
				// Ignore errors for tabs without content script
			});
		} else {
			// Play sound in all T3 Chat tabs (for test sound)
			const tabs = await chrome.tabs.query({
				url: [
					'https://t3.chat/*',
					'https://t3chat.com/*',
					'https://*.t3.chat/*',
					'https://*.t3chat.com/*',
				],
			});

			for (const tab of tabs) {
				chrome.tabs.sendMessage(tab.id, { type: 'play-sound' }, () => {
					// Ignore errors for tabs without content script
				});
			}
		}
	} catch (error) {
		console.error(
			'[T3 Chat Enhancer] Error playing notification sound:',
			error
		);
	}
}

async function forwardMessageToTabs(message) {
	try {
		const tabs = await chrome.tabs.query({
			url: [
				'https://t3.chat/*',
				'https://t3chat.com/*',
				'https://*.t3.chat/*',
				'https://*.t3chat.com/*',
			],
		});

		for (const tab of tabs) {
			chrome.tabs.sendMessage(tab.id, message, () => {
				// Ignore errors for tabs without content script
			});
		}
	} catch (error) {
		console.error(
			'[T3 Chat Enhancer] Error forwarding message to tabs:',
			error
		);
	}
}
