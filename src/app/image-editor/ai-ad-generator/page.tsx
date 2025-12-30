"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Facebook,
  Edit
} from "lucide-react";

interface FacebookAd {
  id: string;
  image: string;
  title: string;
  description: string;
  cta: string;
  link: string;
}

interface BrandInfo {
  brandName: string;
  industry: string;
  targetAudience: string;
  productName: string;
  keyMessage: string;
  cta: string;
  colors: string;
}

export default function AIAdGeneratorPage() {
  const router = useRouter();
  const [step, setStep] = useState<'fetch' | 'select' | 'brand-info' | 'generating' | 'preview'>('fetch');

  // Step 1: Fetch ads
  const [pageId, setPageId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Step 2: Select ads
  const [ads, setAds] = useState<FacebookAd[]>([]);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());

  // Step 3: Brand info
  const [brandInfo, setBrandInfo] = useState<BrandInfo>({
    brandName: "",
    industry: "",
    targetAudience: "",
    productName: "",
    keyMessage: "",
    cta: "",
    colors: ""
  });

  // Step 4: Generated ad result
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const fetchFacebookAds = async () => {
    if (!pageId.trim()) {
      setFetchError("Please enter a Page ID");
      return;
    }

    setIsFetching(true);
    setFetchError("");

    try {
      const response = await fetch("/api/fetch-fb-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          userId: undefined // TODO: Add user authentication
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch ads");
      }

      const data = await response.json();
      setAds(data.ads || []);
      setStep('select');
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to fetch ads");
    } finally {
      setIsFetching(false);
    }
  };

  const toggleAdSelection = (adId: string) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAds(newSelected);
  };

  const proceedToBrandInfo = () => {
    if (selectedAds.size === 0) {
      alert("Please select at least one ad");
      return;
    }
    setStep('brand-info');
  };

  const generateAdWithAI = async () => {
    // Validate brand info
    if (!brandInfo.brandName || !brandInfo.industry || !brandInfo.productName) {
      alert("Please fill in at least Brand Name, Industry, and Product Name");
      return;
    }

    setStep('generating');

    try {
      // Get selected ads data
      const selectedAdsData = ads.filter(ad => selectedAds.has(ad.id));

      // Call AI generation API
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceAds: selectedAdsData,
          referenceAdIds: Array.from(selectedAds), // Pass scraped ad IDs from database
          brandInfo,
          userId: undefined // TODO: Add user authentication
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ad");
      }

      const result = await response.json();

      // Store result and show preview
      setGeneratedResult(result);
      setStep('preview');
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to generate ad");
      setStep('brand-info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">AI Ad Generator</h1>
          <p className="text-gray-400">Analyze competitor ads and generate new ones with AI</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'fetch' ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'fetch' ? 'bg-purple-600' : 'bg-gray-700'}`}>1</div>
              <span className="font-medium">Fetch Ads</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-600" />
            <div className={`flex items-center gap-2 ${step === 'select' ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select' ? 'bg-purple-600' : 'bg-gray-700'}`}>2</div>
              <span className="font-medium">Select Ads</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-600" />
            <div className={`flex items-center gap-2 ${step === 'brand-info' ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'brand-info' ? 'bg-purple-600' : 'bg-gray-700'}`}>3</div>
              <span className="font-medium">Brand Info</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-600" />
            <div className={`flex items-center gap-2 ${step === 'generating' ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'generating' ? 'bg-purple-600' : 'bg-gray-700'}`}>4</div>
              <span className="font-medium">Generate</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {/* STEP 1: Fetch Facebook Ads */}
          {step === 'fetch' && (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Facebook className="h-8 w-8 text-purple-500" />
                <h2 className="text-2xl font-bold text-white">Fetch Facebook Ads</h2>
              </div>

              <p className="text-gray-400 mb-6">
                Enter a Facebook Page ID to fetch their ads for analysis
              </p>

              <div className="max-w-2xl">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Facebook Page ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="e.g., 123456789012345"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && fetchFacebookAds()}
                  />
                  <button
                    onClick={fetchFacebookAds}
                    disabled={isFetching}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Fetch Ads
                      </>
                    )}
                  </button>
                </div>

                {fetchError && (
                  <p className="text-red-400 text-sm mt-2">{fetchError}</p>
                )}

                <p className="text-gray-500 text-sm mt-4">
                  Tip: You can find a Page ID by visiting the Facebook page and looking at the URL or page info
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Select Ads */}
          {step === 'select' && (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                Select Reference Ads ({selectedAds.size} selected)
              </h2>

              <p className="text-gray-400 mb-6">
                Choose ads that you want to use as inspiration for AI generation
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => toggleAdSelection(ad.id)}
                    className={`cursor-pointer rounded-lg border-2 transition-all ${
                      selectedAds.has(ad.id)
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {selectedAds.has(ad.id) && (
                        <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1">{ad.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{ad.description}</p>
                      {ad.cta && (
                        <span className="inline-block mt-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {ad.cta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('fetch')}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={proceedToBrandInfo}
                  disabled={selectedAds.size === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Brand Info Form */}
          {step === 'brand-info' && (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Your Brand Information</h2>

              <p className="text-gray-400 mb-6">
                Provide details about your brand to generate a personalized ad
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brand Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandInfo.brandName}
                    onChange={(e) => setBrandInfo({...brandInfo, brandName: e.target.value})}
                    placeholder="e.g., Nike"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Industry <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandInfo.industry}
                    onChange={(e) => setBrandInfo({...brandInfo, industry: e.target.value})}
                    placeholder="e.g., Sports & Fitness"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={brandInfo.targetAudience}
                    onChange={(e) => setBrandInfo({...brandInfo, targetAudience: e.target.value})}
                    placeholder="e.g., Athletes 18-35"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandInfo.productName}
                    onChange={(e) => setBrandInfo({...brandInfo, productName: e.target.value})}
                    placeholder="e.g., Air Max 2024"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Message
                  </label>
                  <textarea
                    value={brandInfo.keyMessage}
                    onChange={(e) => setBrandInfo({...brandInfo, keyMessage: e.target.value})}
                    placeholder="e.g., Unleash your potential with cutting-edge performance"
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Call to Action
                  </label>
                  <input
                    type="text"
                    value={brandInfo.cta}
                    onChange={(e) => setBrandInfo({...brandInfo, cta: e.target.value})}
                    placeholder="e.g., Shop Now"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brand Colors
                  </label>
                  <input
                    type="text"
                    value={brandInfo.colors}
                    onChange={(e) => setBrandInfo({...brandInfo, colors: e.target.value})}
                    placeholder="e.g., #FF5733, #3498DB"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={generateAdWithAI}
                  className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Ad with AI
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Generating */}
          {step === 'generating' && (
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">Generating Your Ad...</h2>
              <p className="text-gray-400 mb-6">
                AI is analyzing your reference ads and creating a custom design for your brand
              </p>
              <div className="max-w-md mx-auto space-y-2 text-left text-sm text-gray-500">
                <p>✓ Analyzing reference ads...</p>
                <p>✓ Extracting design patterns...</p>
                <p>✓ Generating creative concept...</p>
                <p className="text-purple-400">→ Creating your ad image...</p>
              </div>
            </div>
          )}

          {/* STEP 5: Preview Generated Ad */}
          {step === 'preview' && generatedResult && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-8 w-8 text-green-500" />
                  <h2 className="text-2xl font-bold text-white">Your Generated Ad</h2>
                </div>

                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Ad successfully generated and saved to your library!</span>
                  </div>
                </div>

                <p className="text-gray-400 mb-6">
                  Preview your AI-generated ad below. You can edit it in the editor, view it in your library, or regenerate with different settings.
                </p>

                {/* Ad Preview */}
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    {generatedResult.imageUrl ? (
                      <img
                        src={generatedResult.imageUrl}
                        alt="Generated Ad"
                        className="w-full h-auto rounded-lg shadow-2xl"
                      />
                    ) : (
                      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No image generated</p>
                      </div>
                    )}
                  </div>

                  {/* Ad Details */}
                  {generatedResult.analysis && (
                    <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Design Analysis</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Style:</span>
                          <p className="text-white">{generatedResult.analysis.design_style}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Colors:</span>
                          <p className="text-white">{generatedResult.analysis.color_scheme?.join(", ")}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Headline:</span>
                          <p className="text-white">{generatedResult.analysis.headline}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Subheading:</span>
                          <p className="text-white">{generatedResult.analysis.subheading}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8 justify-center flex-wrap">
                  <button
                    onClick={() => setStep('brand-info')}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => router.push('/my-ads')}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    View in My Ads
                  </button>
                  {generatedResult.generatedAdId && (
                    <button
                      onClick={() => {
                        // Load template in editor
                        const projectId = `generated-ad-${Date.now()}`;
                        localStorage.setItem(`project-${projectId}`, JSON.stringify(generatedResult.template));
                        router.push(`/editor/${projectId}`);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Sparkles className="h-5 w-5" />
                      Edit in Editor
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
