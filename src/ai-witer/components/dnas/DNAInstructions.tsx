"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DNAInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">Instructions</span>
          <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
            <Play className="w-3 h-3 text-white" />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Campaign DNA</h3>
              <p className="text-sm text-gray-700">
                Campaign DNA is a feature that centralizes all essential information about your strategy, allowing you to reuse important data across different agents without needing to type it again. It's an evolution from the previous system of isolated fields, making the process more efficient and consistent.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Note:</strong> you don't need to and shouldn't fill in all fields right away. At minimum, complete <strong>1. Author/Company Biography</strong> and <strong>2. Ideal Customer Profile</strong>. These serve as the foundation for almost all agents. This way, subsequent agents will already have the necessary information to complete your DNA as needed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How does it work?</h3>
              <p className="text-sm text-gray-700 mb-3">
                The best tip, which is also one of the Ghostwriter OS values, is straightforward: when in doubt, <strong>keep it as simple as possible</strong>. Choose quality over quantity, have fewer different profiles, and simplify the process. Then:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-3 ml-4">
                <li>
                  <strong>Create a new DNA:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Choose a clear naming convention (e.g., "Profile 2 | Offer C" or "[Profile 1] Offer B")</li>
                    <li>Fill in the relevant fields</li>
                    <li>Everything saves automatically as you edit</li>
                  </ul>
                </li>
                <li>
                  <strong>Use in agents:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Select the desired DNA from the menu</li>
                    <li>Add specific information if necessary</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important tips</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-3 ml-4">
                <li>
                  <strong>Quality &gt; Quantity:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>You don't need to use all available characters</li>
                    <li>Focus on the most relevant information</li>
                    <li>Follow the instructions for each field</li>
                  </ul>
                </li>
                <li>
                  <strong>Organization:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Keep different DNAs for distinct offers</li>
                    <li>The same profile can have multiple offers</li>
                    <li>Update as needed</li>
                  </ul>
                </li>
                <li>
                  <strong>Default DNA:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Set a DNA as default to load automatically</li>
                    <li>Makes it easier to use across multiple agents</li>
                    <li>Can be changed at any time</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customization</h3>
              <p className="text-sm text-gray-700 mb-2">
                Each agent can receive:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                <li>Pre-loaded base DNA</li>
                <li>Additional specific information in input fields</li>
                <li>Particular adjustments for each use</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tip</h3>
              <p className="text-sm text-gray-700">
                Invest time creating a well-structured DNA initially. This will save a lot of time later and ensure consistency in your campaigns. Remember that you can always edit and adjust as needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

