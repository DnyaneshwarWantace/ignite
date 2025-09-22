import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Type, 
  Sparkles, 
  Globe, 
  Loader2,
  Check,
  Edit3
} from 'lucide-react';
import { TimelineElement, TextVariation } from '../types/variation-types';
import { AIVariationService } from '../services/ai-variation-service';

interface TextVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: TimelineElement;
  onAddVariations: (variations: TextVariation[]) => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
];

export const TextVariationModal: React.FC<TextVariationModalProps> = ({
  isOpen,
  onClose,
  element,
  onAddVariations,
}) => {
  const [generationType, setGenerationType] = useState<'auto' | 'language'>('auto');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [editableVariations, setEditableVariations] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const aiService = AIVariationService.getInstance();

  const handleGenerateVariations = async () => {
    if (!element.originalContent?.text) return;

    setIsGenerating(true);
    try {
      const response = await aiService.generateTextVariations({
        originalText: element.originalContent.text,
        variationType: generationType,
        targetLanguage: selectedLanguage,
        count: 10
      });

      setGeneratedVariations(response.variations);
      setEditableVariations([...response.variations]);
    } catch (error) {
      console.error('Error generating variations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVariations = () => {
    const variations: TextVariation[] = editableVariations.map((text, index) => ({
      id: `variation-${Date.now()}-${index}`,
      content: text,
      type: 'ai-generated',
      metadata: {
        language: generationType === 'language' ? selectedLanguage : 'English',
        aiPrompt: `Generated ${generationType} variation`
      }
    }));

    onAddVariations(variations);
    handleClose();
  };

  const handleClose = () => {
    setGenerationType('auto');
    setSelectedLanguage('');
    setGeneratedVariations([]);
    setEditableVariations([]);
    setIsEditing(false);
    onClose();
  };

  const handleVariationEdit = (index: number, value: string) => {
    const updated = [...editableVariations];
    updated[index] = value;
    setEditableVariations(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Create Text Variations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Element Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {element.elementName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Current variations: {element.currentVariationCount}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  "{element.originalContent?.text || 'No text content'}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto Generate */}
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => setGenerationType('auto')}>
                <div className={`w-4 h-4 rounded-full border-2 ${generationType === 'auto' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`} />
                <Sparkles className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium">Auto Generate Variations</h4>
                  <p className="text-xs text-gray-500">AI will create 10 creative variations</p>
                </div>
              </div>

              {/* Language Variations */}
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => setGenerationType('language')}>
                <div className={`w-4 h-4 rounded-full border-2 ${generationType === 'language' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`} />
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="text-sm font-medium">Language Variations</h4>
                  <p className="text-xs text-gray-500">Generate variations in different languages</p>
                </div>
              </div>

              {/* Language Selector */}
              {generationType === 'language' && (
                <div className="ml-8">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateVariations}
                disabled={isGenerating || (generationType === 'language' && !selectedLanguage)}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Variations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate 10 Variations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Variations */}
          {generatedVariations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Generated Variations</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Done Editing' : 'Edit Variations'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {editableVariations.map((variation, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      {isEditing ? (
                        <Textarea
                          value={variation}
                          onChange={(e) => handleVariationEdit(index, e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                      ) : (
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{variation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {generatedVariations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Original:</strong> {element.currentVariationCount} variation{element.currentVariationCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>New:</strong> {generatedVariations.length} AI-generated variation{generatedVariations.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-800 font-medium">
                    <strong>Total:</strong> {element.currentVariationCount + generatedVariations.length} variations
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveVariations}
            disabled={isGenerating || generatedVariations.length === 0}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Add Variations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
