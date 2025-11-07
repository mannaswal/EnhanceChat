# T3 Chat Enhancer Browser Extension

A Chrome browser extension that enhances T3 Chat with audio notifications and dynamic favicon indicators when streaming completes.

## Features

- 🎵 **Audio Notifications**: Plays a chime sound when streaming completes
- 🎚️ **Volume Control**: Adjustable notification volume (0-10) with persistent settings
- 🔛 **Enable/Disable Toggle**: Quickly turn the extension on or off
- 🟡 **Favicon Indicators**:
  - Yellow dot appears when streaming is active
  - Green dot appears when streaming completes
  - Automatically restores original favicon after 3 seconds
- 🖥️ **Terminal-Themed Popup**: Clean, minimal interface

## Installation

1. **Build the Popup** (Required before loading extension):

   - Navigate to the `popup` directory: `cd popup`
   - Install dependencies: `pnpm install`
   - Build the popup: `pnpm build`
   - This will create the built files in `dist/popup/`

2. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this `EnhanceChat` directory

## Popup Interface

The extension popup features a clean, terminal-themed interface with:

- **Volume Slider**: Control notification volume from 0 to 10 (default: 5)
- **Enable/Disable Switch**: Toggle the extension on or off
- **Settings Persistence**: All settings are automatically saved and persist across sessions

Settings are stored using Chrome's `storage.local` API and sync across all tabs.

## How It Works

### Streaming Detection

The extension uses two methods to detect streaming status:

1. **Primary Method**: Monitors the send/stop button state

   - Detects when a stop button appears (indicates streaming)
   - Detects when send button is disabled while input has text

2. **Fallback Method**: Monitors WebSocket connections
   - Watches for WebSocket open/close events
   - Analyzes message content for streaming indicators

### Favicon Updates

- **Automatically loads T3 Chat's existing favicon** - No need to download it manually!
- Dynamically overlays colored dots on the existing T3 Chat favicon using HTML5 Canvas
- Uses `fetch()` API to reliably load the favicon (handles CORS issues)
- Preserves the original favicon URL for perfect restoration
- Updates occur in real-time as streaming state changes

### Notification Sound

- Plays when streaming transitions from active to complete
- Uses the notification sound file from the `assets/` directory
- Volume controlled via popup slider (0-10)
- Fallback support for both MP3 and WAV formats

## File Structure

```
EnhanceChat/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for notifications
├── content.js             # Content script for monitoring and favicon updates
├── popup/                 # Vite React app for the extension popup
│   ├── src/
│   │   ├── App.tsx       # Main popup component
│   │   ├── components/
│   │   │   ├── DebugPanel.tsx  # Debug tools (for development)
│   │   │   └── ui/       # shadcn/ui components
│   │   └── index.css     # Terminal-themed styles
│   ├── dist/             # Built popup files (generated after build)
│   └── package.json      # Popup dependencies
├── dist/popup/           # Built popup output (created after build)
├── utils/
│   └── favicon.js         # Favicon overlay utilities (reference)
├── assets/
│   ├── notification.mp3    # Notification sound (add your own)
│   ├── icons/
│   │   ├── icon16.png    # Extension icon 16x16
│   │   ├── icon48.png    # Extension icon 48x48
│   │   ├── icon128.png   # Extension icon 128x128
│   │   └── generate-icons.html  # Icon generator tool
│   └── README.md         # Assets information
└── README.md             # This file
```

## Customization

### Changing Notification Sound

Replace `assets/notification.mp3` with your preferred sound file. Supported formats: MP3, WAV.

### Adjusting Volume

Use the volume slider in the popup (0-10). Settings are automatically saved.

### Adjusting Favicon Dot Colors

Edit the color values in `content.js`:

- Yellow dot: Line ~215: `ctx.fillStyle = color === 'yellow' ? '#FFC107' : '#4CAF50';`
- Green dot: Same line, second color value

### Adjusting Detection Selectors

If T3 Chat's button selectors change, update the selectors in `content.js` (around line 75-80):

```javascript
const sendButton = document.querySelector('button[type="submit"], ...');
const stopButton = document.querySelector('button[aria-label*="stop" i], ...');
```

### Customizing Popup Theme

The popup uses a terminal-themed dark mode. To customize:

- Edit `popup/src/index.css` to modify colors and styling
- Colors use OKLCH color space for better consistency
- Theme variables are defined in the `:root` selector

## Browser Support

Currently supports Chrome/Chromium (Manifest V3). Firefox support can be added later with a Manifest V2 version.

## Troubleshooting

- **No notification sound**: Ensure `assets/notification.mp3` or `assets/notification.wav` exists
- **Volume not working**: Check that the volume slider is set above 0 in the popup
- **Favicon not updating**: Check browser console for CORS errors (may need to adjust favicon loading)
- **Not detecting streaming**: Inspect T3 Chat's DOM and update button selectors in `content.js`
- **Popup not showing**: Make sure you've built the popup (`cd popup && pnpm build`)

## Development

### Building the Popup

The popup is built with Vite + React + Tailwind CSS v4 + shadcn/ui. To build it:

```bash
cd popup
pnpm install  # First time only
pnpm build
```

After building, reload the extension in Chrome to see the changes.

### Development Workflow

1. Make changes to the popup in `popup/src/`
2. Run `pnpm build` from the `popup` directory
3. Reload the extension in Chrome (`chrome://extensions/` → click reload)

### Adding shadcn/ui Components

To add new shadcn/ui components:

```bash
cd popup
pnpm dlx shadcn@latest add [component-name]
```

For example:

```bash
pnpm dlx shadcn@latest add dialog
```

### Debug Panel

A debug panel component is available at `popup/src/components/DebugPanel.tsx` for testing and development. It includes:

- Sound testing
- Favicon state manipulation
- Extension status checking

To use it, import and render `<DebugPanel />` in your component.

### Tech Stack

- **Vite**: Build tool and dev server
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Utility-first CSS with OKLCH colors
- **shadcn/ui**: Accessible component library

### Future Enhancements

- Configurable notification sounds
- User preferences/options page
- Firefox support
- More robust streaming detection
- Custom notification sound selection

## License

This is a personal project for enhancing T3 Chat experience.
