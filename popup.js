/**
 * Popup script for T3 Chat Enhancer debug/playground
 */

async function getCurrentTab() {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab;
}

function isT3ChatTab(tab) {
	return tab.url && (tab.url.includes('t3chat.com') || tab.url.includes('t3.chat'));
}

document.getElementById('testSound').addEventListener('click', async () => {
	const statusDiv = document.getElementById('soundStatus');
	statusDiv.textContent = 'Testing...';
	statusDiv.className = 'status';

	try {
		const response = await chrome.runtime.sendMessage({ type: 'test-sound' });
		if (response && response.success) {
			statusDiv.textContent = '✅ Sound played successfully!';
			statusDiv.className = 'status success';
		} else {
			statusDiv.textContent = '⚠️ Sound may have played but no confirmation received';
			statusDiv.className = 'status';
		}
	} catch (error) {
		statusDiv.textContent = `Error: ${error.message}`;
		statusDiv.className = 'status error';
	}
});

document.getElementById('applyFavicon').addEventListener('click', async () => {
	const statusDiv = document.getElementById('faviconStatus');
	const selectedState = document.querySelector('input[name="faviconState"]:checked').value;

	statusDiv.textContent = 'Applying...';
	statusDiv.className = 'status';

	try {
		const tab = await getCurrentTab();

		if (!isT3ChatTab(tab)) {
			statusDiv.textContent = '⚠️ Please open T3 Chat in the current tab';
			statusDiv.className = 'status error';
			return;
		}

		chrome.tabs.sendMessage(tab.id, { type: 'set-favicon-state', state: selectedState }, (response) => {
			if (chrome.runtime.lastError) {
				statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
				statusDiv.className = 'status error';
			} else if (response && response.success) {
				statusDiv.textContent = `✅ Favicon set to: ${selectedState}`;
				statusDiv.className = 'status success';
			} else {
				statusDiv.textContent = '⚠️ Failed to apply favicon state';
				statusDiv.className = 'status error';
			}
		});
	} catch (error) {
		statusDiv.textContent = `Error: ${error.message}`;
		statusDiv.className = 'status error';
	}
});

document.getElementById('checkPage').addEventListener('click', async () => {
	const statusDiv = document.getElementById('debugStatus');
	statusDiv.textContent = 'Checking...';
	statusDiv.className = 'status';

	try {
		const tab = await getCurrentTab();

		if (!isT3ChatTab(tab)) {
			statusDiv.innerHTML = '⚠️ Not on T3 Chat page<br>Current URL: ' + (tab.url || 'Unknown');
			statusDiv.className = 'status error';
			return;
		}

		chrome.tabs.sendMessage(tab.id, { type: 'ping' }, (response) => {
			if (chrome.runtime.lastError) {
				statusDiv.innerHTML = `❌ Content script not responding<br>Error: ${chrome.runtime.lastError.message}<br><br>Try reloading the page after installing the extension.`;
				statusDiv.className = 'status error';
			} else if (response && response.initialized) {
				statusDiv.innerHTML = `✅ Extension is active!<br>Status: ${response.status || 'Running'}`;
				statusDiv.className = 'status success';
			} else {
				statusDiv.innerHTML = '⚠️ Content script responded but not initialized';
				statusDiv.className = 'status error';
			}
		});
	} catch (error) {
		statusDiv.textContent = `Error: ${error.message}`;
		statusDiv.className = 'status error';
	}
});
