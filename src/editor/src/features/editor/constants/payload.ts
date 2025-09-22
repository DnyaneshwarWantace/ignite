import { generateId } from "@designcombo/timeline";
import { DEFAULT_FONT } from "./font";
import { PlatformConfig } from "../platform-preview/platform-preview";

// Utility function to validate element positioning within canvas bounds
export const validateElementBounds = (element: { left: number; top: number; width: number; height: number }, platformConfig: PlatformConfig) => {
  const { width: canvasWidth, height: canvasHeight } = platformConfig;
  
  const right = element.left + element.width;
  const bottom = element.top + element.height;
  
  const isWithinBounds = element.left >= 0 && 
                        element.top >= 0 && 
                        right <= canvasWidth && 
                        bottom <= canvasHeight;
  
  if (!isWithinBounds) {
    console.warn('Element outside canvas bounds:', {
      element,
      canvasSize: { width: canvasWidth, height: canvasHeight },
      bounds: { right, bottom }
    });
  }
  
  return isWithinBounds;
};

// Function to calculate center position based on platform configuration
export const calculateTextCenterPosition = (platformConfig: PlatformConfig) => {
  const { width, height } = platformConfig;
  
  // Calculate center position for text
  // Assuming text width is 600px (from the original payload)
  const textWidth = 600;
  const textHeight = 120; // Approximate height based on fontSize
  
  const centerX = (width - textWidth) / 2;
  const centerY = (height - textHeight) / 2;
  
  return {
    left: Math.max(0, centerX),
    top: Math.max(0, centerY),
  };
};

// Function to calculate center position for media (images/videos) with bounds checking
export const calculateMediaCenterPosition = (platformConfig: PlatformConfig, mediaWidth: number = 400, mediaHeight: number = 300) => {
  const { width, height } = platformConfig;
  
  // Safety check for valid platform size
  if (!width || !height || width <= 0 || height <= 0) {
    console.warn('Invalid platform size:', platformConfig);
    return {
      left: 50,
      top: 50,
      width: Math.min(mediaWidth, 400),
      height: Math.min(mediaHeight, 300),
    };
  }
  
  // Calculate aspect ratio to determine sizing strategy
  const platformAspectRatio = width / height;
  
  // For very wide aspect ratios (like Facebook Feed 1.91:1), use more conservative sizing
  let maxWidthRatio = 0.8;
  let maxHeightRatio = 0.8;
  
  if (platformAspectRatio > 1.5) {
    // For wide formats, be more conservative with height
    maxWidthRatio = 0.7;
    maxHeightRatio = 0.6;
  } else if (platformAspectRatio < 0.7) {
    // For tall formats, be more conservative with width
    maxWidthRatio = 0.6;
    maxHeightRatio = 0.7;
  }
  
  // Ensure media doesn't exceed platform bounds
  const maxWidth = Math.min(mediaWidth, width * maxWidthRatio);
  const maxHeight = Math.min(mediaHeight, height * maxHeightRatio);
  
  // Calculate center position
  const centerX = (width - maxWidth) / 2;
  const centerY = (height - maxHeight) / 2;
  
  // Ensure position is within bounds with extra safety margin
  const left = Math.max(10, Math.min(centerX, width - maxWidth - 10));
  const top = Math.max(10, Math.min(centerY, height - maxHeight - 10));
  
  // Final safety check to ensure element fits within platform
  const finalLeft = Math.max(0, Math.min(left, width - maxWidth));
  const finalTop = Math.max(0, Math.min(top, height - maxHeight));
  
  // Debug logging
  console.log('Media positioning calculation:', {
    platform: platformConfig.name,
    platformSize: { width, height },
    platformAspectRatio,
    maxWidthRatio,
    maxHeightRatio,
    maxWidth,
    maxHeight,
    centerX,
    centerY,
    finalLeft,
    finalTop,
    result: {
      left: finalLeft,
      top: finalTop,
      width: maxWidth,
      height: maxHeight,
    }
  });
  
  return {
    left: finalLeft,
    top: finalTop,
    width: maxWidth,
    height: maxHeight,
  };
};

// Function to create text payload with proper positioning
export const createTextPayload = (platformConfig: PlatformConfig) => {
  const position = calculateTextCenterPosition(platformConfig);
  
  return {
    id: generateId(),
    display: {
      from: 0,
      to: 5000,
    },
    type: "text",
    details: {
      text: "Heading and some body",
      fontSize: 120,
      width: 600,
      fontUrl: DEFAULT_FONT.url,
      fontFamily: DEFAULT_FONT.postScriptName,
      color: "#000000",
      wordWrap: "break-word",
      textAlign: "center",
      borderWidth: 0,
      borderColor: "#000000",
      boxShadow: {
        color: "#000000",
        x: 0,
        y: 0,
        blur: 0,
      },
      // Add positioning
      left: position.left,
      top: position.top,
    },
  };
};

// Function to create image payload with proper positioning
export const createImagePayload = (platformConfig: PlatformConfig, src: string = "https://cdn.designcombo.dev/rect-gray.png") => {
  const position = calculateMediaCenterPosition(platformConfig, 400, 300);
  
  // Validate the positioning
  validateElementBounds(position, platformConfig);
  
  return {
    id: generateId(),
    display: {
      from: 0,
      to: 5000,
    },
    type: "image",
    details: {
      src: src,
      width: position.width,
      height: position.height,
      // Add positioning
      left: position.left,
      top: position.top,
    },
  };
};

// Function to create video payload with proper positioning
export const createVideoPayload = (platformConfig: PlatformConfig, src: string) => {
  const position = calculateMediaCenterPosition(platformConfig, 400, 300);
  
  // Validate the positioning
  validateElementBounds(position, platformConfig);
  
  return {
    id: generateId(),
    display: {
      from: 0,
      to: 5000,
    },
    type: "video",
    details: {
      src: src,
      width: position.width,
      height: position.height,
      // Add positioning
      left: position.left,
      top: position.top,
    },
  };
};

export const TEXT_ADD_PAYLOAD = {
	id: generateId(),
	display: {
		from: 0,
		to: 5000,
	},
	type: "text",
	details: {
		text: "Heading and some body",
		fontSize: 120,
		width: 600,
		fontUrl: DEFAULT_FONT.url,
		fontFamily: DEFAULT_FONT.postScriptName,
		color: "#000000",
		wordWrap: "break-word",
		textAlign: "center",
		borderWidth: 0,
		borderColor: "#000000",
		boxShadow: {
			color: "#000000",
			x: 0,
			y: 0,
			blur: 0,
		},
		// Default center position for 9:16 aspect ratio (1080x1920)
		left: 240, // (1080 - 600) / 2
		top: 900,  // (1920 - 120) / 2
	},
};
