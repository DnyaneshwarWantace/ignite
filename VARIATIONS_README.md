# Video & Media Variation Generator System

A comprehensive video ad variation generator similar to Refract, allowing users to create multiple video variations by combining different media elements (video, text, images, audio) with AI-powered text generation.

## 🎯 Overview

This system enables users to:
- Add multiple media types to a timeline (video, text, images, audio)
- Generate AI-powered text variations
- Manually upload video, image, and audio variations
- Automatically calculate all possible combinations
- Export all generated video variations

## 🚀 Features

### 1. Timeline Elements Management
- **Video Clips**: Upload and manage video files
- **Text Overlays**: Add text with AI-powered variation generation
- **Images**: Upload and manage image files
- **Audio Clips**: Upload and manage audio files

### 2. AI-Powered Text Variations
- **Auto Generate**: Creates 10 creative variations of the original text
- **Language Variations**: Generate variations in different languages
- **Editable Results**: All generated variations can be edited before saving

### 3. Manual Media Variations
- **Video Variations**: Upload multiple video files
- **Image Variations**: Upload multiple image files
- **Audio Variations**: Upload multiple audio files

### 4. Smart Combination Logic
- Automatically calculates total video combinations
- Real-time updates as variations are added/removed
- Handles complex scenarios with multiple elements

### 5. Export System
- Preview all generated combinations
- Individual video download
- Bulk download functionality
- Progress tracking for video generation

## 📁 File Structure

```
src/editor/src/features/editor/menu-item/
├── variations.tsx              # Main variations component
├── variations.css              # Variations component styles
├── video-export.tsx            # Video export modal component
├── video-export.css            # Video export styles
├── variations-manager.tsx      # Main manager component
└── variations-manager.css      # Manager component styles
```

## 🎮 Usage Flow

### Step 1: Add Elements to Timeline
```typescript
// Example timeline elements
const timelineElements = [
  {
    id: 'video-1',
    type: 'video',
    name: 'Main Video',
    content: 'video-url.mp4',
    duration: 30,
    variations: []
  },
  {
    id: 'text-1',
    type: 'text',
    name: 'Call to Action',
    content: 'Best summer sale!',
    variations: []
  }
];
```

### Step 2: Generate Variations
1. Click on "Variations" in the sidebar
2. Select an element from the timeline
3. Choose variation type:
   - **Text**: Use AI generation or language variations
   - **Video/Image/Audio**: Upload files manually

### Step 3: Export Videos
1. Click "Export Videos" button
2. Review all generated combinations
3. Download individual videos or bulk download

## 🤖 AI Text Generation

### Auto Generate Prompt
```
You are a creative marketing assistant.
Given the original text below, generate exactly 10 short variations.
Each variation must:
- Preserve the original message intent.
- Use clear, persuasive, and engaging language.
- Be under 10 words.
- Avoid repetition.
- Include stylistic diversity (some urgent, some casual, some formal).

Original text: "{user_text}"
Output as a numbered list (1–10).
```

### Language Variation Prompt
```
You are a translation and creative rewriting expert.
Given the original text below, generate exactly 10 variations in {target_language}.
Each variation must:
- Maintain the original intent.
- Use natural expressions for the target language.
- Be under 10 words.
- Avoid direct literal translation — make it engaging for a native audience.
- Vary the tone (some urgent, some casual, some formal).

Original text: "{user_text}"
Output as a numbered list (1–10) in {target_language}.
```

## 📊 Combination Calculation

The system automatically calculates total video combinations using the formula:

```
Total Combinations = Product of all element variation counts
```

### Examples:

**Example 1: Simple Text Variation**
- Video: 1 variation
- Text: 11 variations (1 original + 10 AI-generated)
- **Total: 1 × 11 = 11 videos**

**Example 2: Multiple Elements**
- Video A: 5 variations
- Video B: 3 variations
- Text: 11 variations
- Audio: 2 variations
- **Total: 5 × 3 × 11 × 2 = 330 videos**

**Example 3: Complex Scenario**
- Video A: 5 variations
- Video B: 3 variations
- Text: 11 variations
- Image: 4 variations
- Audio: 2 variations
- **Total: 5 × 3 × 11 × 4 × 2 = 1,320 videos**

## 🎨 UI Components

### 1. Variations Manager
- Main sidebar component
- Shows timeline elements summary
- Displays total combinations
- Export button with badge count

### 2. Text Variations Modal
- Current text display
- Auto-generate button
- Language selection dropdown
- Generated variations list with edit capability
- Success message display

### 3. Video Variations Modal
- Current video preview
- Upload section for new videos
- Video variations list with previews
- Delete functionality

### 4. Image/Audio Variations Modal
- Similar structure to video modal
- Appropriate preview components
- Upload and management functionality

### 5. Video Export Modal
- Statistics dashboard
- Video grid with thumbnails
- Status indicators (pending, processing, completed)
- Download progress tracking
- Bulk download functionality

## 🔧 Integration

### Basic Integration
```typescript
import VariationsManager from './variations-manager';

function Editor() {
  const [timelineElements, setTimelineElements] = useState([]);

  return (
    <div className="editor">
      <div className="main-content">
        {/* Your video editor content */}
      </div>
      <div className="sidebar">
        <VariationsManager
          timelineElements={timelineElements}
          onTimelineElementsChange={setTimelineElements}
        />
      </div>
    </div>
  );
}
```

### Advanced Integration with Timeline
```typescript
// Connect with your existing timeline system
const handleTimelineElementAdd = (element) => {
  const newElement = {
    id: generateId(),
    type: element.type,
    name: element.name,
    content: element.content,
    duration: element.duration,
    variations: []
  };
  
  setTimelineElements(prev => [...prev, newElement]);
};

const handleVariationUpdate = (elementId, variations) => {
  setTimelineElements(prev => 
    prev.map(el => 
      el.id === elementId 
        ? { ...el, variations } 
        : el
    )
  );
};
```

## 🎯 Edge Cases Handled

### 1. Multiple Videos in Timeline
- Each video can have independent variations
- Combinations multiply correctly
- Supports complex video sequences

### 2. Zero Variations
- Automatically reverts to 1 (original only)
- Prevents division by zero errors
- Clear user feedback

### 3. Large Combination Counts
- Warns users if exceeding threshold
- Optimized rendering for large lists
- Pagination for export modal

### 4. Mixed Media Types
- Text uses AI generation
- Other media types use manual upload
- Consistent UI patterns across types

## 🚀 Performance Optimizations

### 1. Lazy Loading
- Video thumbnails load on demand
- Modal content loads when opened
- Efficient re-rendering

### 2. Memory Management
- Cleanup of file URLs
- Proper component unmounting
- Optimized state updates

### 3. Responsive Design
- Mobile-friendly layouts
- Adaptive grid systems
- Touch-friendly interactions

## 🎨 Styling

The system uses Ant Design components with custom CSS for:
- Consistent design language
- Smooth animations and transitions
- Responsive layouts
- Accessibility features

## 🔮 Future Enhancements

### Planned Features
1. **Batch Processing**: Process multiple variations simultaneously
2. **Template System**: Save and reuse variation sets
3. **Advanced AI**: More sophisticated text generation
4. **Video Preview**: Real-time preview of combinations
5. **Analytics**: Track variation performance
6. **Collaboration**: Share variation sets with team members

### Technical Improvements
1. **Web Workers**: Background video processing
2. **Caching**: Cache generated variations
3. **Progressive Loading**: Load variations progressively
4. **Offline Support**: Work without internet connection

## 📝 API Integration

### Text Generation API
```typescript
const generateTextVariations = async (text: string, options: {
  type: 'auto' | 'language';
  language?: string;
}) => {
  const response = await fetch('/api/generate-text-variations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ...options })
  });
  
  return response.json();
};
```

### Video Processing API
```typescript
const processVideoCombination = async (combination: {
  video: string;
  text: string;
  image?: string;
  audio?: string;
}) => {
  const response = await fetch('/api/process-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(combination)
  });
  
  return response.json();
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Variations not saving**
   - Check if `onVariationsChange` callback is properly connected
   - Verify state management in parent component

2. **AI generation not working**
   - Ensure API endpoint is configured
   - Check network connectivity
   - Verify API key if required

3. **Video upload issues**
   - Check file size limits
   - Verify supported file formats
   - Ensure proper file permissions

4. **Performance issues with large combinations**
   - Implement pagination
   - Use virtual scrolling for large lists
   - Optimize re-rendering

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Note**: This system is designed to be highly modular and can be easily integrated into existing video editing applications. The AI text generation can be customized by replacing the prompt templates with your own AI service integration.
