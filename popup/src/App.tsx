import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function App() {
	const [volume, setVolume] = useState<number>(5);
	const [enabled, setEnabled] = useState<boolean>(true);

	// Load saved settings on mount
	useEffect(() => {
		chrome.storage.local.get(['volume', 'enabled'], (result) => {
			if (result.volume !== undefined) {
				setVolume(result.volume);
			}
			if (result.enabled !== undefined) {
				setEnabled(result.enabled);
			}
		});
	}, []);

	// Save volume when it changes
	const handleVolumeChange = (value: number[]) => {
		const newVolume = value[0];
		setVolume(newVolume);
		chrome.storage.local.set({ volume: newVolume });
		// Send message to background/content script to update volume
		chrome.runtime.sendMessage({
			type: 'set-volume',
			volume: newVolume,
		});
	};

	// Save enabled state when it changes
	const handleEnabledChange = (checked: boolean) => {
		setEnabled(checked);
		chrome.storage.local.set({ enabled: checked });
		// Send message to background/content script to enable/disable
		chrome.runtime.sendMessage({
			type: 'set-enabled',
			enabled: checked,
		});
	};

	return (
		<div className="w-[300px] p-6 font-mono bg-background text-foreground dark">
			<h1 className="text-lg font-bold mb-6 text-foreground">
				T3 Chat Enhancer
			</h1>

			<div className="space-y-6">
				{/* Volume Control */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="volume"
							className="text-sm">
							Volume
						</Label>
						<span className="text-sm text-muted-foreground">{volume}/10</span>
					</div>
					<Slider
						id="volume"
						value={[volume]}
						onValueChange={handleVolumeChange}
						min={0}
						max={10}
						step={1}
						className="w-full"
					/>
				</div>

				{/* Enable/Disable Switch */}
				<div className="flex items-center justify-between">
					<Label
						htmlFor="enabled"
						className="text-sm">
						Enabled
					</Label>
					<Switch
						id="enabled"
						checked={enabled}
						onCheckedChange={handleEnabledChange}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
