import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Helper function to get the current active tab
 */
async function getCurrentTab(): Promise<chrome.tabs.Tab> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab;
}

/**
 * Check if the current tab is a T3 Chat tab
 */
function isT3ChatTab(tab: chrome.tabs.Tab): boolean {
	return tab.url
		? tab.url.includes('t3chat.com') || tab.url.includes('t3.chat')
		: false;
}

type StatusType = 'idle' | 'success' | 'error';

interface Status {
	message: string;
	type: StatusType;
}

/**
 * Debug Panel Component
 * Contains debugging functionality for testing the extension
 */
export function DebugPanel() {
	const [soundStatus, setSoundStatus] = useState<Status | null>(null);
	const [faviconStatus, setFaviconStatus] = useState<Status | null>(null);
	const [debugStatus, setDebugStatus] = useState<Status | null>(null);
	const [faviconState, setFaviconState] = useState<
		'idle' | 'streaming' | 'done'
	>('idle');

	const handleTestSound = async () => {
		setSoundStatus({ message: 'Testing...', type: 'idle' });
		try {
			const response = await chrome.runtime.sendMessage({ type: 'test-sound' });
			if (response && response.success) {
				setSoundStatus({
					message: '✅ Sound played successfully!',
					type: 'success',
				});
			} else {
				setSoundStatus({
					message: '⚠️ Sound may have played but no confirmation received',
					type: 'idle',
				});
			}
		} catch (error) {
			setSoundStatus({
				message: `Error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				type: 'error',
			});
		}
	};

	const handleApplyFavicon = async () => {
		setFaviconStatus({ message: 'Applying...', type: 'idle' });
		try {
			const tab = await getCurrentTab();

			if (!isT3ChatTab(tab)) {
				setFaviconStatus({
					message: '⚠️ Please open T3 Chat in the current tab',
					type: 'error',
				});
				return;
			}

			if (!tab.id) {
				setFaviconStatus({
					message: 'Error: Tab ID not available',
					type: 'error',
				});
				return;
			}

			chrome.tabs.sendMessage(
				tab.id,
				{ type: 'set-favicon-state', state: faviconState },
				(response) => {
					if (chrome.runtime.lastError) {
						setFaviconStatus({
							message: `Error: ${chrome.runtime.lastError.message}`,
							type: 'error',
						});
					} else if (response && response.success) {
						setFaviconStatus({
							message: `✅ Favicon set to: ${faviconState}`,
							type: 'success',
						});
					} else {
						setFaviconStatus({
							message: '⚠️ Failed to apply favicon state',
							type: 'error',
						});
					}
				}
			);
		} catch (error) {
			setFaviconStatus({
				message: `Error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				type: 'error',
			});
		}
	};

	const handleCheckPage = async () => {
		setDebugStatus({ message: 'Checking...', type: 'idle' });
		try {
			const tab = await getCurrentTab();

			if (!isT3ChatTab(tab)) {
				setDebugStatus({
					message: `⚠️ Not on T3 Chat page\nCurrent URL: ${
						tab.url || 'Unknown'
					}`,
					type: 'error',
				});
				return;
			}

			if (!tab.id) {
				setDebugStatus({
					message: 'Error: Tab ID not available',
					type: 'error',
				});
				return;
			}

			chrome.tabs.sendMessage(tab.id, { type: 'ping' }, (response: any) => {
				if (chrome.runtime.lastError) {
					setDebugStatus({
						message: `❌ Content script not responding\nError: ${chrome.runtime.lastError.message}\n\nTry reloading the page after installing the extension.`,
						type: 'error',
					});
				} else if (response && response.initialized) {
					setDebugStatus({
						message: `✅ Extension is active!\nStatus: ${
							response.status || 'Running'
						}`,
						type: 'success',
					});
				} else {
					setDebugStatus({
						message: '⚠️ Content script responded but not initialized',
						type: 'error',
					});
				}
			});
		} catch (error) {
			setDebugStatus({
				message: `Error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				type: 'error',
			});
		}
	};

	return (
		<div className="w-[300px] p-4 font-sans">
			<h2 className="text-lg font-semibold mb-4 text-gray-900">
				🔧 T3 Chat Enhancer - Debug
			</h2>

			<div className="space-y-4">
				{/* Notification Sound Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Notification Sound</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button
							onClick={handleTestSound}
							variant="outline"
							className="w-full">
							🔊 Test Notification Sound
						</Button>
						{soundStatus && (
							<Alert
								variant={
									soundStatus.type === 'error'
										? 'destructive'
										: soundStatus.type === 'success'
										? 'default'
										: 'default'
								}>
								<AlertDescription className="text-xs whitespace-pre-line">
									{soundStatus.message}
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>

				{/* Favicon State Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Favicon State</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<RadioGroup
							value={faviconState}
							onValueChange={(value) =>
								setFaviconState(value as 'idle' | 'streaming' | 'done')
							}
							className="flex gap-2">
							<div className="flex-1">
								<Label
									htmlFor="idle"
									className={cn(
										'flex items-center justify-center p-2 rounded cursor-pointer transition-colors',
										faviconState === 'idle'
											? 'bg-primary text-primary-foreground'
											: 'bg-gray-100 hover:bg-gray-200'
									)}>
									<RadioGroupItem
										value="idle"
										id="idle"
										className="sr-only"
									/>
									<span className="text-xs">Idle</span>
								</Label>
							</div>
							<div className="flex-1">
								<Label
									htmlFor="streaming"
									className={cn(
										'flex items-center justify-center p-2 rounded cursor-pointer transition-colors',
										faviconState === 'streaming'
											? 'bg-primary text-primary-foreground'
											: 'bg-gray-100 hover:bg-gray-200'
									)}>
									<RadioGroupItem
										value="streaming"
										id="streaming"
										className="sr-only"
									/>
									<span className="text-xs">Streaming</span>
								</Label>
							</div>
							<div className="flex-1">
								<Label
									htmlFor="done"
									className={cn(
										'flex items-center justify-center p-2 rounded cursor-pointer transition-colors',
										faviconState === 'done'
											? 'bg-primary text-primary-foreground'
											: 'bg-gray-100 hover:bg-gray-200'
									)}>
									<RadioGroupItem
										value="done"
										id="done"
										className="sr-only"
									/>
									<span className="text-xs">Done</span>
								</Label>
							</div>
						</RadioGroup>
						<Button
							onClick={handleApplyFavicon}
							className="w-full">
							Apply Favicon State
						</Button>
						{faviconStatus && (
							<Alert
								variant={
									faviconStatus.type === 'error'
										? 'destructive'
										: faviconStatus.type === 'success'
										? 'default'
										: 'default'
								}>
								<AlertDescription className="text-xs whitespace-pre-line">
									{faviconStatus.message}
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>

				{/* Debug Info Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Debug Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button
							onClick={handleCheckPage}
							variant="outline"
							className="w-full">
							Check if Extension is Active
						</Button>
						{debugStatus && (
							<Alert
								variant={
									debugStatus.type === 'error'
										? 'destructive'
										: debugStatus.type === 'success'
										? 'default'
										: 'default'
								}>
								<AlertDescription className="text-xs whitespace-pre-line">
									{debugStatus.message}
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

