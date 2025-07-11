// Only import these modules on server-side
let fs: any = null;
let path: any = null;
let ffmpeg: any = null;
let axios: any = null;
let uuidv4: any = null;
let AdmZip: any = null;

// Server-side only initialization
if (typeof window === 'undefined') {
  fs = require('fs-extra');
  path = require('path');
  ffmpeg = require('fluent-ffmpeg');
  axios = require('axios').default;
  uuidv4 = require('uuid').v4;
  AdmZip = require('adm-zip');
}

// Try to load Vosk, but don't fail if it's not available
let vosk: any = null;
if (typeof window === 'undefined') {
  try {
    vosk = require('vosk-koffi');
    console.log('✅ Vosk loaded successfully');
  } catch (error) {
    console.log('❌ Vosk not available:', (error as Error).message);
  }
}

// Language configurations for Vosk models
const SUPPORTED_LANGUAGES = {
  'en-us': {
    name: 'English (US)',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
    modelSize: '40MB',
    extractedFolder: 'vosk-model-small-en-us-0.15'
  },
  'es': {
    name: 'Spanish',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip',
    modelSize: '39MB',
    extractedFolder: 'vosk-model-small-es-0.42'
  },
  'fr': {
    name: 'French',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip',
    modelSize: '41MB',
    extractedFolder: 'vosk-model-small-fr-0.22'
  },
  'de': {
    name: 'German',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip',
    modelSize: '45MB',
    extractedFolder: 'vosk-model-small-de-0.15'
  },
  'ru': {
    name: 'Russian',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip',
    modelSize: '45MB',
    extractedFolder: 'vosk-model-small-ru-0.22'
  },
  'zh-cn': {
    name: 'Chinese (Mandarin)',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip',
    modelSize: '42MB',
    extractedFolder: 'vosk-model-small-cn-0.22'
  },
  'it': {
    name: 'Italian',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip',
    modelSize: '48MB',
    extractedFolder: 'vosk-model-small-it-0.22'
  },
  'pt': {
    name: 'Portuguese',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip',
    modelSize: '31MB',
    extractedFolder: 'vosk-model-small-pt-0.3'
  },
  'hi': {
    name: 'Hindi',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-hi-0.22.zip',
    modelSize: '42MB',
    extractedFolder: 'vosk-model-small-hi-0.22'
  },
  'ja': {
    name: 'Japanese',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ja-0.22.zip',
    modelSize: '48MB',
    extractedFolder: 'vosk-model-small-ja-0.22'
  },
  'ko': {
    name: 'Korean',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ko-0.22.zip',
    modelSize: '82MB',
    extractedFolder: 'vosk-model-small-ko-0.22'
  },
  'ar': {
    name: 'Arabic',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip',
    modelSize: '318MB',
    extractedFolder: 'vosk-model-ar-mgb2-0.4'
  },
  'tr': {
    name: 'Turkish',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-tr-0.3.zip',
    modelSize: '35MB',
    extractedFolder: 'vosk-model-small-tr-0.3'
  },
  'nl': {
    name: 'Dutch',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-nl-0.22.zip',
    modelSize: '39MB',
    extractedFolder: 'vosk-model-small-nl-0.22'
  },
  'vi': {
    name: 'Vietnamese',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-vn-0.4.zip',
    modelSize: '32MB',
    extractedFolder: 'vosk-model-small-vn-0.4'
  },
  'uk': {
    name: 'Ukrainian',
    modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-uk-v3-small.zip',
    modelSize: '133MB',
    extractedFolder: 'vosk-model-small-uk-v3-small'
  }
};

const DEFAULT_LANGUAGE = 'en-us';

// Create necessary directories
const getProjectRoot = () => process.cwd();
const tempDir = path.join(getProjectRoot(), 'temp');
const modelsDir = path.join(getProjectRoot(), 'vosk-models');

// Ensure directories exist
export async function ensureDirectories() {
  await fs.ensureDir(tempDir);
  await fs.ensureDir(modelsDir);
}

// Download video from URL
export async function downloadVideo(url: string, outputPath: string): Promise<string> {
  try {
    console.log('Downloading video from URL:', url);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'video/mp4,video/*,*/*',
        'Referer': 'https://www.facebook.com/',
      }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Video download completed');
        resolve(outputPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download video: ${(error as Error).message}`);
  }
}

// Extract audio from video
export async function extractAudio(videoPath: string, audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Extracting audio from video...');
    
    ffmpeg(videoPath)
      .toFormat('wav')
      .audioFrequency(16000)
      .audioChannels(1)
      .on('end', () => {
        console.log('Audio extraction completed');
        resolve(audioPath);
      })
      .on('error', (err: any) => {
        console.error('Audio extraction failed:', err);
        reject(err);
      })
      .save(audioPath);
  });
}

// Download and setup Vosk model for specific language
export async function setupVoskModel(languageCode: string = DEFAULT_LANGUAGE): Promise<string> {
  const langConfig = SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES];
  
  if (!langConfig) {
    throw new Error(`Unsupported language: ${languageCode}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  const modelPath = path.join(modelsDir, languageCode);
  const modelZipPath = path.join(modelsDir, `${languageCode}.zip`);
  
  // Check if model already exists
  if (await fs.pathExists(modelPath) && await fs.pathExists(path.join(modelPath, 'conf'))) {
    console.log(`✅ ${langConfig.name} model already available`);
    return modelPath;
  }
  
  try {
    console.log(`📥 Downloading ${langConfig.name} model (${langConfig.modelSize})...`);
    
    // Download model if not exists
    if (!await fs.pathExists(modelZipPath)) {
      const response = await axios({
        method: 'GET',
        url: langConfig.modelUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(modelZipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`✅ ${langConfig.name} model downloaded`);
    }
    
    // Extract model
    console.log(`📂 Extracting ${langConfig.name} model...`);
    const zip = new AdmZip(modelZipPath);
    zip.extractAllTo(modelsDir, true);
    
    // Rename extracted folder to language code
    const extractedPath = path.join(modelsDir, langConfig.extractedFolder);
    if (await fs.pathExists(extractedPath)) {
      if (await fs.pathExists(modelPath)) {
        await fs.remove(modelPath);
      }
      await fs.move(extractedPath, modelPath);
    }
    
    // Clean up zip file
    await fs.remove(modelZipPath);
    
    console.log(`✅ ${langConfig.name} model ready for free transcription!`);
    return modelPath;
    
  } catch (error) {
    console.error(`❌ Failed to setup ${langConfig.name} model:`, (error as Error).message);
    throw error;
  }
}

// Transcribe audio using Vosk
export async function transcribeWithVosk(audioPath: string, languageCode: string = DEFAULT_LANGUAGE) {
  try {
    if (!vosk) {
      throw new Error('Vosk not available');
    }

    const langConfig = SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES];
    console.log(`Starting FREE transcription with Vosk (${langConfig.name})...`);
    
    // Setup model
    const modelPath = await setupVoskModel(languageCode);
    
    // Initialize Vosk with correct API
    vosk.setLogLevel(0); // Reduce verbosity
    const model = new vosk.Model(modelPath);
    const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
    
    // Read and process audio file
    const audioBuffer = await fs.readFile(audioPath);
    
    // Check if audio file is too small (likely no content)
    if (audioBuffer.length < 1000) {
      rec.free();
      model.free();
      return {
        text: '',
        confidence: 0,
        words: [],
        speakers: [],
        duration: 0,
        service: `Vosk (${langConfig.name} - 100% FREE)`,
        language: languageCode,
        noSpeech: true
      };
    }
    
    // Process audio in chunks
    let finalResult = '';
    const chunkSize = 4000; // Process in 4KB chunks
    
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      const chunk = audioBuffer.slice(i, i + chunkSize);
      
      const endOfSpeech = rec.acceptWaveform(chunk);
      if (endOfSpeech) {
        const result = rec.result();
        if (result.text) {
          finalResult += result.text + ' ';
        }
      }
    }
    
    // Get final result
    const finalResult2 = rec.finalResult();
    if (finalResult2.text) {
      finalResult += finalResult2.text;
    }
    
    // Clean up
    rec.free();
    model.free();
    
    const transcriptText = finalResult.trim();
    
    // Check if no speech was detected
    const hasContent = transcriptText.length > 0;
    
    if (!hasContent) {
      console.log(`${langConfig.name} transcription completed: No speech detected`);
      return {
        text: '',
        confidence: 0,
        words: [],
        speakers: [],
        duration: 0,
        service: `Vosk (${langConfig.name} - 100% FREE)`,
        language: languageCode,
        noSpeech: true
      };
    }
    
    console.log(`${langConfig.name} transcription completed:`, transcriptText.substring(0, 100) + '...');
    
    return {
      text: transcriptText,
      confidence: 0.85, // Vosk doesn't provide confidence in this setup
      words: [], // Vosk can provide word-level data but simplified for now
      speakers: [],
      duration: 0,
      service: `Vosk (${langConfig.name} - 100% FREE)`,
      language: languageCode,
      noSpeech: false
    };
    
  } catch (error) {
    console.error('Vosk transcription failed:', (error as Error).message);
    throw error;
  }
}

// Main transcription function
export async function transcribeAudio(audioPath: string, languageCode: string = DEFAULT_LANGUAGE) {
  try {
    console.log(`Attempting FREE transcription with Vosk (${SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES]?.name || languageCode})...`);
    const result = await transcribeWithVosk(audioPath, languageCode);
    console.log('Transcription successful with Vosk (FREE)');
    return result;
  } catch (error) {
    console.error('Vosk transcription failed:', (error as Error).message);
    throw new Error('Free transcription failed: ' + (error as Error).message);
  }
}

// Clean up temporary files
export async function cleanup(files: string[]) {
  for (const file of files) {
    try {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
        console.log('Cleaned up:', file);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Full transcription workflow
export async function transcribeVideoFromUrl(videoUrl: string, languageCode: string = DEFAULT_LANGUAGE) {
  await ensureDirectories();
  
  const jobId = uuidv4();
  const videoPath = path.join(tempDir, `video-${jobId}.mp4`);
  const audioPath = path.join(tempDir, `audio-${jobId}.wav`);
  const tempFiles = [videoPath, audioPath];

  try {
    console.log(`Job ${jobId}: Starting transcription in ${SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES]?.name || languageCode}`);
    
    // Download video
    await downloadVideo(videoUrl, videoPath);
    
    // Extract audio
    await extractAudio(videoPath, audioPath);
    
    // Transcribe audio
    const transcription = await transcribeAudio(audioPath, languageCode);
    
    // Clean up temporary files
    await cleanup(tempFiles);
    
    return {
      success: true,
      jobId: jobId,
      transcription: transcription.text,
      metadata: {
        confidence: transcription.confidence,
        duration: transcription.duration,
        wordCount: transcription.text.split(' ').length,
        service: transcription.service,
        language: transcription.language,
        hasTimestamps: false,
        hasSpeakers: false,
        noSpeech: transcription.noSpeech || false
      },
      words: transcription.words || [],
      speakers: transcription.speakers || [],
      languageUsed: languageCode
    };
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Clean up files on error
    await cleanup(tempFiles);
    
    throw error;
  }
}

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE }; 