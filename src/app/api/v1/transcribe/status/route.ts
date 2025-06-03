import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/lib/vosk-transcription';
import fs from 'fs-extra';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Check if Vosk is available
    let voskAvailable = false;
    try {
      require('vosk-koffi');
      voskAvailable = true;
    } catch (error) {
      voskAvailable = false;
    }

    // Check which models are already downloaded
    const modelsDir = path.join(process.cwd(), 'vosk-models');
    const availableModels: Record<string, boolean> = {};
    
    for (const [code] of Object.entries(SUPPORTED_LANGUAGES)) {
      const modelPath = path.join(modelsDir, code);
      const confPath = path.join(modelPath, 'conf');
      availableModels[code] = await fs.pathExists(modelPath) && await fs.pathExists(confPath);
    }

    return NextResponse.json({
      status: 'ready',
      services: {
        vosk: voskAvailable,
        ffmpeg: true, // Assuming ffmpeg is available
        integrated: true
      },
      features: [
        'Multi-language transcription', 
        'Video URL download', 
        'Integrated transcription', 
        'Multiple formats',
        'Database caching'
      ],
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
      availableModels,
      languages: Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => ({
        code,
        name: config.name,
        modelSize: config.modelSize,
        downloaded: availableModels[code]
      })),
      message: voskAvailable 
        ? 'Integrated multi-language transcription service ready'
        : 'Vosk not available - install vosk-koffi for transcription'
    });

  } catch (error) {
    console.error('Status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 