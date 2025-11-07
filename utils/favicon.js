/**
 * Favicon overlay utilities
 * Handles adding colored dot indicators to the existing favicon
 */

/**
 * Creates a favicon with a colored dot overlay
 * @param {string} color - Color of the dot ('yellow' or 'green')
 * @param {number} size - Size of the favicon (default: 32)
 */
async function updateFaviconWithDot(color, size = 32) {
  // Get the current favicon
  const currentFavicon = getCurrentFavicon();
  
  if (!currentFavicon) {
    console.warn('Could not find current favicon');
    return;
  }

  try {
    // Load the favicon image
    const img = await loadImage(currentFavicon);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw the original favicon
    ctx.drawImage(img, 0, 0, size, size);
    
    // Draw colored dot in bottom-right corner
    const dotRadius = size * 0.15; // 15% of favicon size
    const dotX = size - dotRadius - 2; // 2px padding from edge
    const dotY = size - dotRadius - 2;
    
    ctx.fillStyle = color === 'yellow' ? '#FFC107' : '#4CAF50';
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add white border for better visibility
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Convert to data URL and update favicon
    const dataUrl = canvas.toDataURL('image/png');
    setFavicon(dataUrl);
    
    return dataUrl;
  } catch (error) {
    console.error('Error updating favicon:', error');
    console.error(error);
  }
}

/**
 * Gets the current favicon URL
 * @returns {string|null} The current favicon URL or null if not found
 */
function getCurrentFavicon() {
  // Try to find existing favicon link
  let favicon = document.querySelector("link[rel~='icon']");
  
  if (!favicon) {
    // Try apple-touch-icon or shortcut icon
    favicon = document.querySelector("link[rel='apple-touch-icon']") ||
              document.querySelector("link[rel='shortcut icon']");
  }
  
  if (favicon) {
    return favicon.href;
  }
  
  // Fallback to default favicon location
  const baseUrl = window.location.origin;
  return `${baseUrl}/favicon.ico`;
}

/**
 * Loads an image from URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If CORS fails, try without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = reject;
      fallbackImg.src = url;
    };
    
    img.src = url;
  });
}

/**
 * Sets the favicon to the specified URL
 * @param {string} url - The new favicon URL
 */
function setFavicon(url) {
  // Remove existing favicon links
  const existingFavicons = document.querySelectorAll("link[rel~='icon']");
  existingFavicons.forEach(link => link.remove());
  
  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  
  // Also update apple-touch-icon for consistency
  let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = url;
}

/**
 * Restores the original favicon
 */
function restoreOriginalFavicon() {
  // Remove current favicon
  const existingFavicons = document.querySelectorAll("link[rel~='icon']");
  existingFavicons.forEach(link => link.remove());
  
  // Try to restore from original source
  const baseUrl = window.location.origin;
  const originalFavicon = `${baseUrl}/favicon.ico`;
  
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = originalFavicon;
  document.head.appendChild(link);
}

// Export functions for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateFaviconWithDot,
    restoreOriginalFavicon
  };
}

