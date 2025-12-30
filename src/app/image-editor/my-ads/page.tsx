"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function MyGeneratedAdsPage() {
  const router = useRouter();
  const [generatedAds, setGeneratedAds] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchGeneratedAds = async () => {
      try {
        const response = await fetch('/api/ads?limit=100');
        if (response.ok) {
          const data = await response.json();
          setGeneratedAds(data);
        } else {
          setGeneratedAds([]);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
        setGeneratedAds([]);
      }
    };

    fetchGeneratedAds();
  }, []);

  const handleEdit = (adId: string, json: any) => {
    // Create a new project with this template
    const projectId = `generated-ad-${Date.now()}`;
    localStorage.setItem(`project-${projectId}`, JSON.stringify(json));
    router.push(`/editor/${projectId}`);
  };

  const handleDelete = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh the list
        setGeneratedAds(generatedAds?.filter(ad => ad.id !== adId) || []);
      } else {
        alert("Failed to delete ad");
      }
    } catch (error) {
      alert("Failed to delete ad");
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Generated Ads</h1>
              <p className="text-gray-400">AI-generated ads saved to your library</p>
            </div>
            <button
              onClick={() => router.push('/ai-ad-generator')}
              className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate New Ad
            </button>
          </div>
        </div>

        {/* Generated Ads Grid */}
        {!generatedAds ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-400 mt-4">Loading your ads...</p>
          </div>
        ) : generatedAds.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
            <Sparkles className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Generated Ads Yet</h2>
            <p className="text-gray-400 mb-6">Start by generating your first AI-powered ad</p>
            <button
              onClick={() => router.push('/ai-ad-generator')}
              className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate Ad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group hover:border-purple-500 transition-all"
              >
                {/* Ad Preview */}
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Template Preview</p>
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleEdit(ad.id, ad.json)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Ad Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 truncate">{ad.name}</h3>
                  <div className="space-y-1 text-sm">
                    {ad.brandInfo && (
                      <>
                        <p className="text-gray-400">
                          <span className="text-gray-500">Brand:</span> {ad.brandInfo.brandName}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-gray-500">Product:</span> {ad.brandInfo.productName}
                        </p>
                      </>
                    )}
                    <p className="text-gray-500 text-xs">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
