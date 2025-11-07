import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';

function App() {
	const [volume, setVolume] = useState<number>(5);
	const [enabled, setEnabled] = useState<boolean>(true);
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const sliderRef = useRef<HTMLDivElement>(null);

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
	const handleVolumeChange = (newVolume: number) => {
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

	// Render ASCII slider: hyphens with "0" at current position
	const renderASCIISlider = () => {
		const sliderLength = 21; // 21 positions for volumes 0.0-10.0 (in 0.5 increments)
		const sliderArray = Array(sliderLength).fill('-');
		// Map volume (0-10) to position (0-20), where each position is 0.5 volume
		const position = Math.round(volume * 2);
		const clampedPosition = Math.max(0, Math.min(sliderLength - 1, position));
		sliderArray[clampedPosition] = '0';
		return sliderArray.join('');
	};

	// Calculate volume from mouse position (with 0.5 increments)
	const getVolumeFromPosition = (clientX: number, element: HTMLElement) => {
		const rect = element.getBoundingClientRect();
		const clickX = clientX - rect.left;
		const width = rect.width;
		// Calculate position as a ratio (0 to 1), then scale to 0-20 positions (21 total positions)
		const ratio = Math.max(0, Math.min(1, clickX / width));
		const position = Math.round(ratio * 20);
		const clampedPosition = Math.max(0, Math.min(20, position));
		// Convert position to volume (each position is 0.5 volume)
		const calculatedVolume = clampedPosition * 0.5;
		return Math.max(0, Math.min(10, calculatedVolume));
	};

	// Handle mouse down to start dragging
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsDragging(true);
		const newVolume = getVolumeFromPosition(e.clientX, e.currentTarget);
		handleVolumeChange(newVolume);
	};

	// Handle mouse up to stop dragging
	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Handle mouse leave to stop dragging
	const handleMouseLeave = () => {
		setIsDragging(false);
	};

	// Add global mouse move and mouse up listeners for dragging
	useEffect(() => {
		if (isDragging && sliderRef.current) {
			const handleGlobalMouseMove = (e: MouseEvent) => {
				if (sliderRef.current) {
					const newVolume = getVolumeFromPosition(e.clientX, sliderRef.current);
					handleVolumeChange(newVolume);
				}
			};

			const handleGlobalMouseUp = () => {
				setIsDragging(false);
			};

			window.addEventListener('mousemove', handleGlobalMouseMove);
			window.addEventListener('mouseup', handleGlobalMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleGlobalMouseMove);
				window.removeEventListener('mouseup', handleGlobalMouseUp);
			};
		}
	}, [isDragging]);

	return (
		<div className="w-auto p-[1lh] jetbrains-mono bg-background text-foreground dark">
			<h1 className="text-sm font-bold text-foreground mb-[1lh]">
				T3 Chat Enhancer
			</h1>

			<div className="space-y-[1lh]">
				{/* Volume Control */}
				<div className="space-y-[1lh]">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="volume"
							className="text-sm">
							Volume
						</Label>
						<span className="text-sm text-muted-foreground">
							{volume.toFixed(1)}/10
						</span>
					</div>
					<div
						ref={sliderRef}
						className="text-sm font-mono cursor-pointer select-none whitespace-nowrap"
						onMouseDown={handleMouseDown}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseLeave}>
						{renderASCIISlider()}
					</div>
				</div>

				{/* Enable/Disable Switch */}
				<div className="flex items-center justify-between">
					<Label
						htmlFor="enabled"
						className="text-sm">
						Enabled
					</Label>
					<button
						id="enabled"
						type="button"
						onClick={() => handleEnabledChange(!enabled)}
						className="font-mono cursor-pointer select-none hover:opacity-80">
						{enabled ? '[x]' : '[ ]'}
					</button>
				</div>
			</div>
		</div>
	);
}

export default App;
