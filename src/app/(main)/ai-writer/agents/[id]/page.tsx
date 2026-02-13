"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronDown, Copy, Save, FileText, Info, BarChart3, Download, Eye } from "lucide-react";
import * as Icons from "lucide-react";
import { AGENTS } from "@/lib/ai-writer/agents";
import { docOSStorage } from "@/lib/ai-writer/storage";
import CharacterLimitTextarea from "@/components/ai-writer/ui/CharacterLimitTextarea";
import Select from "@/components/ai-writer/ui/Select";
import DeleteConfirmDialog from "@/components/ai-writer/ui/DeleteConfirmDialog";
import ReactMarkdown from "react-markdown";
import { getUserFriendlyError, extractErrorFromResponse } from "@/lib/ai-writer/errorMessages";
import { withBasePath } from "@/lib/base-path";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

const VSL_SECTIONS = [
  { value: "Section #1 - Introduction / Real Cause of the Problem", label: "Section #1 - Introduction / Real Cause of the Problem" },
  { value: "Section #2 - Solution Mechanism", label: "Section #2 - Solution Mechanism" },
  { value: "Section #3-4 - The Damaging Admission / Transition", label: "Section #3-4 - The Damaging Admission / Transition" },
  { value: "Section #5 - The Solution (Product)", label: "Section #5 - The Solution (Product)" },
  { value: "Section #6-7 - Offer / CTA + Scarcity", label: "Section #6-7 - Offer / CTA + Scarcity" },
  { value: "Section #8-9 - Bonuses / Guarantee", label: "Section #8-9 - Bonuses / Guarantee" },
  { value: "Section #10-12 - Urgency / Options / Close", label: "Section #10-12 - Urgency / Options / Close" },
];

export default function AgentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params.id as string;
  const agent = AGENTS.find((a) => a.id === agentId);
  const targetSectionId = searchParams?.get("targetSection") || undefined;

  const [dnas, setDnas] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDNA, setSelectedDNA] = useState("");
  const [generalInput, setGeneralInput] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"response" | "history" | "docos" | "feedback" | "test">("response");
  const [metadata, setMetadata] = useState<any>(null);
  const [showTestView, setShowTestView] = useState(false);
  const [docosDocuments, setDocosDocuments] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [funnelStage, setFunnelStage] = useState("Awareness");
  const [tweetFormat, setTweetFormat] = useState("Single Tweet");
  const [vslSection, setVslSection] = useState(VSL_SECTIONS[0].value);
  const [showInstructions, setShowInstructions] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [topic, setTopic] = useState("");
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);
  const [dnaContextUsed, setDnaContextUsed] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<Array<{ id?: string; content: string; agentId: string; agentName?: string; timestamp: number; dnaId?: string; metadata?: unknown }>>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<typeof historyItems[0] | null>(null);

  const loadHistory = async () => {
    if (!agentId) return;
    try {
      const res = await fetch(withBasePath(`/api/v1/ai-writer/history?agentId=${encodeURIComponent(agentId)}`), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      const list = json.payload ?? [];
      setHistoryItems(list);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const saveToHistory = async (payload: { content: string; agentName?: string; dnaId?: string; metadata?: unknown }) => {
    try {
      const res = await fetch(withBasePath("/api/v1/ai-writer/history"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId,
          agentName: payload.agentName ?? agent?.name,
          content: payload.content,
          dnaId: payload.dnaId ?? (selectedDNA || undefined),
          metadata: payload.metadata ?? null,
        }),
      });
      if (res.ok) loadHistory();
    } catch (e) {
      console.error("Failed to save to history:", e);
    }
  };

  useEffect(() => {
    loadDNAs();
    loadDocOSDocuments();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [agentId]);

  useEffect(() => {
    if (activeTab !== "history") setSelectedHistoryItem(null);
  }, [activeTab]);

  const loadDNAs = async () => {
    try {
      const res = await fetch(withBasePath("/api/v1/ai-writer/dnas"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load DNAs");
      const json = await res.json();
      const data = json.payload ?? [];
      if (data.length > 0) {
        setDnas(data.map((d: any) => ({ id: d.id, name: d.name })));
        const defaultDNA = data.find((d: any) => d.is_default) || data[0];
        setSelectedDNA(defaultDNA.id);
      }
    } catch (error) {
      console.error("Error loading DNAs:", error);
      alert("Failed to load DNAs. Please check your connection.");
    }
  };

  const loadDocOSDocuments = () => {
    const docs = docOSStorage.getAll();
    // Filter by current agent if on agent page
    const filtered = agentId ? docs.filter(d => d.agentId === agentId) : docs;
    setDocosDocuments(filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const handleDeleteDoc = (docId: string, docTitle: string) => {
    setDocToDelete({ id: docId, title: docTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDoc = () => {
    if (!docToDelete) return;
    docOSStorage.delete(docToDelete.id);
    loadDocOSDocuments();
    setDocToDelete(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showLanguageDropdown]);

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ className?: string }>;
    if (!IconComponent) {
      return Icons.Circle;
    }
    return IconComponent;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActiveTab("response");

    try {
      // Load DNA data
      let parsedDNA = null;
      const sectionsWithContent: string[] = [];

      if (selectedDNA) {
        const secRes = await fetch(withBasePath(`/api/v1/ai-writer/dnas/${selectedDNA}/sections`), { credentials: "include" });
        if (secRes.ok) {
          const secData = await secRes.json();
          const sectionsData = secData.payload ?? [];
          parsedDNA = {};
          sectionsData.forEach((section: any) => {
            parsedDNA[section.section_id] = {
              content: section.content || "",
              completed: section.completed || false,
              last_edit: section.last_edit,
            };
            if (section.content && section.content.trim()) {
              const sectionNames: Record<string, string> = {
                authorBiography: "Author/Company Bio",
                idealClientProfile: "Ideal Client Profile",
                authorBrandVoice: "Brand Voice",
                buyingProfile: "Buying Profile",
                persuasivePremise: "Persuasive Premise",
                falseBeliefs: "False Beliefs",
                productOfferUVP: "Product/Offer/UVP",
                proofs: "Proofs",
                testimonials: "Testimonials",
                theProblem: "The Problem",
                theSolution: "The Solution",
              };
              sectionsWithContent.push(sectionNames[section.section_id] || section.section_id);
            }
          });
          setDnaContextUsed(sectionsWithContent);
        }
      }

      const apiResponse = await fetch(withBasePath("/api/v1/ai-writer/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId,
          agentName: agent?.name,
          dnaData: parsedDNA,
          generalInput,
          vslSection: agent?.hasVSLSections ? vslSection : undefined,
          funnelStage: agent?.hasFunnelStage ? funnelStage : undefined,
          tweetFormat: agent?.hasFunnelStage ? tweetFormat : undefined,
          keywords: agentId === "youtube-description" ? keywords : undefined,
          topic: agentId === "thumbnail-titles" ? topic : undefined,
          language: selectedLanguage.code,
          targetSectionId: targetSectionId, // Pass target section ID for progressive context
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        const friendlyError = extractErrorFromResponse(errorData);
        throw new Error(friendlyError);
      }

      const data = await apiResponse.json();
      const payload = data.payload ?? data;
      const content = payload.content ?? data.content ?? "";
      setResponse(content);

      if (payload.metadata) {
        setMetadata(payload.metadata);
      }

      await saveToHistory({
        content,
        agentName: agent?.name,
        dnaId: selectedDNA,
        metadata: payload.metadata ?? null,
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      setResponse(
        `## Error Generating Content\n\n${error.message}\n\n### Troubleshooting:\n\n1. Make sure you've added your API key to \`.env.local\`\n2. Copy \`.env.local.example\` to \`.env.local\` and add your OPENAI_API_KEY or ANTHROPIC_API_KEY\n3. Restart the development server after adding environment variables`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Count words (excluding line breaks and extra spaces)
  const countWords = (text: string): number => {
    if (!text || !text.trim()) return 0;
    // Remove extra whitespace and line breaks, then split by spaces
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces/line breaks with single space
      .trim()
      .split(' ')
      .filter(word => word.length > 0).length;
  };

  // Strip markdown formatting for plain text copy
  const stripMarkdown = (text: string): string => {
    let plainText = text;

    // Remove headers (##, ###, etc.)
    plainText = plainText.replace(/^#{1,6}\s+/gm, '');

    // Remove bold (**text** or __text__)
    plainText = plainText.replace(/\*\*(.+?)\*\*/g, '$1');
    plainText = plainText.replace(/__(.+?)__/g, '$1');

    // Remove italic (*text* or _text_)
    plainText = plainText.replace(/\*(.+?)\*/g, '$1');
    plainText = plainText.replace(/_(.+?)_/g, '$1');

    // Remove inline code (`code`)
    plainText = plainText.replace(/`(.+?)`/g, '$1');

    // Remove links [text](url) - keep only text
    plainText = plainText.replace(/\[(.+?)\]\(.+?\)/g, '$1');

    // Remove strikethrough (~~text~~)
    plainText = plainText.replace(/~~(.+?)~~/g, '$1');

    return plainText;
  };

  const handleCopy = async () => {
    try {
      // Copy plain text without markdown formatting
      const plainText = stripMarkdown(response);
      await navigator.clipboard.writeText(plainText);
      // Show a subtle notification instead of alert
      const notification = document.createElement("div");
      notification.textContent = "Copied to clipboard!";
      notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const plainText = stripMarkdown(response);
      const textArea = document.createElement("textarea");
      textArea.value = plainText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Copied to clipboard!");
    }
  };

  const handleSave = async () => {
    if (!response.trim()) {
      alert("No content to save!");
      return;
    }

    // Save to docOS
    const docTitle = `${agent?.name} - ${new Date().toLocaleDateString()}`;
    docOSStorage.create({
      title: docTitle,
      content: response,
      agentId,
      agentName: agent?.name,
      dnaId: selectedDNA,
    });

    await saveToHistory({
      content: response,
      agentName: agent?.name,
      dnaId: selectedDNA,
    });

    // Reload docOS documents
    loadDocOSDocuments();

    // Show notification
    const notification = document.createElement("div");
    notification.textContent = "Saved to docOS!";
    notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(response);
      const notification = document.createElement("div");
      notification.textContent = "Output copied to clipboard!";
      notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    } catch (err) {
      alert("Failed to copy output");
    }
  };

  // Function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gim, '<li>$2</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap list items in ul tags
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    
    // Wrap in paragraph tags
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  };

  const handleDownloadPDF = () => {
    if (!response || !metadata) {
      alert("No content or metadata available to download!");
      return;
    }

    // Escape HTML but preserve markdown formatting for conversion
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Convert markdown to HTML
    const systemPromptHtml = markdownToHtml(metadata.systemPrompt || 'N/A');
    const userPromptHtml = markdownToHtml(metadata.prompt || 'N/A');
    const outputHtml = markdownToHtml(response);

    // Create a well-structured HTML document
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${agent?.name} - Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2d2d2d;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    .metadata-section {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .output-section {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .prompt-section {
      background-color: #f5f5f5;
      border-left: 4px solid #1a1a1a;
      padding: 15px;
      margin: 20px 0;
      font-size: 13px;
      overflow-x: auto;
      line-height: 1.6;
    }
    .prompt-section h1, .prompt-section h2, .prompt-section h3 {
      margin-top: 15px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .prompt-section h1 { font-size: 20px; }
    .prompt-section h2 { font-size: 18px; }
    .prompt-section h3 { font-size: 16px; }
    .prompt-section p {
      margin: 10px 0;
      line-height: 1.6;
    }
    .prompt-section ul, .prompt-section ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    .prompt-section li {
      margin: 5px 0;
    }
    .prompt-section code {
      background-color: #e8e8e8;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .prompt-section pre {
      background-color: #e8e8e8;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .prompt-section pre code {
      background: none;
      padding: 0;
    }
    .prompt-section strong {
      font-weight: 600;
      color: #1a1a1a;
    }
    .output-section {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      line-height: 1.8;
      font-size: 14px;
    }
    .output-section h1, .output-section h2, .output-section h3 {
      margin-top: 20px;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    .output-section h1 { font-size: 24px; }
    .output-section h2 { font-size: 20px; }
    .output-section h3 { font-size: 18px; }
    .output-section p {
      margin: 12px 0;
      line-height: 1.8;
    }
    .output-section ul, .output-section ol {
      margin: 12px 0;
      padding-left: 30px;
    }
    .output-section li {
      margin: 6px 0;
    }
    .output-section code {
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    .output-section pre {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 15px 0;
    }
    .output-section pre code {
      background: none;
      padding: 0;
    }
    .output-section strong {
      font-weight: 600;
      color: #1a1a1a;
    }
    .timestamp {
      color: #666;
      font-size: 12px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>${agent?.name} - Test Report</h1>
  <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>

  <h2>Metadata</h2>
  <div class="metadata-section">
    <table>
      <tr>
        <th>Agent Name</th>
        <td>${metadata.agentName || agent?.name || 'N/A'}</td>
      </tr>
      <tr>
        <th>Time Taken</th>
        <td>${metadata.timeTaken || 'N/A'}</td>
      </tr>
      <tr>
        <th>Model</th>
        <td>${metadata.model || 'N/A'}</td>
      </tr>
      <tr>
        <th>Provider</th>
        <td>${metadata.provider || 'N/A'}</td>
      </tr>
      <tr>
        <th>Tokens (Prompt)</th>
        <td>${metadata.tokens?.prompt || 0}</td>
      </tr>
      <tr>
        <th>Tokens (Completion)</th>
        <td>${metadata.tokens?.completion || 0}</td>
      </tr>
      <tr>
        <th>Tokens (Total)</th>
        <td>${metadata.tokens?.total || 0}</td>
      </tr>
    </table>
  </div>

  <h2>1. Raw Input Data</h2>
  <div class="metadata-section">
    <h3>General Input</h3>
    <div class="prompt-section">${(metadata.rawInput?.generalInput || 'None').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${(() => {
      if (!metadata.rawInput?.dnaData) return '';
      const sectionNames = {
        authorBiography: "Author/Company Bio",
        idealClientProfile: "Ideal Client Profile",
        authorBrandVoice: "Brand Voice",
        buyingProfile: "Buying Profile",
        persuasivePremise: "Persuasive Premise",
        falseBeliefs: "False Beliefs to Address",
        productOfferUVP: "Product/Offer/UVP",
        proofs: "Proofs",
        testimonials: "Testimonials",
        theProblem: "The Problem",
        theSolution: "The Solution",
      };
      const getContent = (section: any): string | null => {
        if (!section) return null;
        if (typeof section === 'string') return section;
        if (section.content) return section.content;
        return null;
      };
      let dnaHtml = '<h3>DNA Data Sections</h3>';
      Object.entries(metadata.rawInput.dnaData).forEach(([sectionId, sectionData]) => {
        const content = getContent(sectionData);
        if (content && content.trim()) {
          const sectionName = (sectionNames as Record<string, string>)[sectionId] || sectionId;
          const escapedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          dnaHtml += `<div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #1a1a1a;"><strong>${sectionName}:</strong><div style="margin-top: 8px; white-space: pre-wrap; font-size: 11px;">${escapedContent}</div></div>`;
        }
      });
      return dnaHtml;
    })()}
    <table style="margin-top: 20px;">
      ${metadata.rawInput?.vslSection ? `<tr><th>VSL Section</th><td>${metadata.rawInput.vslSection}</td></tr>` : ''}
      ${metadata.rawInput?.funnelStage ? `<tr><th>Funnel Stage</th><td>${metadata.rawInput.funnelStage}</td></tr>` : ''}
      ${metadata.rawInput?.tweetFormat ? `<tr><th>Tweet Format</th><td>${metadata.rawInput.tweetFormat}</td></tr>` : ''}
      ${metadata.rawInput?.keywords ? `<tr><th>Keywords</th><td>${metadata.rawInput.keywords}</td></tr>` : ''}
      ${metadata.rawInput?.topic ? `<tr><th>Topic</th><td>${metadata.rawInput.topic}</td></tr>` : ''}
      ${metadata.rawInput?.language ? `<tr><th>Language</th><td>${metadata.rawInput.language}</td></tr>` : ''}
      ${metadata.rawInput?.targetSectionId ? `<tr><th>Target Section ID</th><td>${metadata.rawInput.targetSectionId}</td></tr>` : ''}
    </table>
  </div>

  <h2>2. System Prompt (Sent to AI)</h2>
  <div class="prompt-section">${systemPromptHtml}</div>

  <h2>3. User Prompt (Constructed from Input)</h2>
  <div class="prompt-section">${userPromptHtml}</div>

  <h2>4. Generated Output (From AI)</h2>
  <div class="output-section">${outputHtml}</div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent?.name || 'output'}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show notification
    const notification = document.createElement("div");
    notification.textContent = "Downloading test report...";
    notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  if (!agent) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Agent not found</h1>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(agent.icon);

  return (
    <div className="flex h-full">
      {/* Left Panel - Input */}
      <div className="w-1/2 border-r border-gray-200 p-8 overflow-auto">
        <div className="w-full">
          {/* Agent Header */}
          <div className="flex items-start space-x-4 mb-6">
            <IconComponent className="w-10 h-10 text-gray-700" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <FileText className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600">{agent.description}</p>
            </div>
          </div>

          {/* Campaign DNA Selector */}
          <div>
            <Select
              label="Campaign DNA"
              options={dnas.map((dna) => ({ value: dna.id, label: dna.name }))}
              value={selectedDNA}
              onChange={setSelectedDNA}
            />
            {targetSectionId && (
              <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Progressive Context Active:</strong> This agent will use all previous DNA sections as context to generate better results. The AI will have access to all completed sections before this one.
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2 italic">
              New Feature{" "}
              <span className="text-gray-900 underline cursor-pointer">
                Click here
              </span>{" "}
              to learn how it works, and also to create and edit your DNAs.
            </p>
          </div>

          {/* General Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              General{" "}
              <Info className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Enter any relevant information for this agent here. Ideas, news, content, hooks,
              mechanisms, testimonials, etc.
            </p>
            <CharacterLimitTextarea
              value={generalInput}
              onChange={setGeneralInput}
              maxLength={10000}
              placeholder="Enter any relevant information for this agent here. Ideas, news, content, hooks, mechanisms, testimonials, etc."
              className="min-h-[200px]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use this field to provide any other relevant information you want the agent to take
              into consideration. Everything you type here will be included as part of the final
              command (prompt) to the agent. Therefore, use it to add more information, references,
              commands, etc.
            </p>
          </div>

          {/* Keywords for YouTube Description */}
          {agentId === "youtube-description" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <CharacterLimitTextarea
                value={keywords}
                onChange={setKeywords}
                maxLength={500}
                placeholder="Insert the keywords"
              />
            </div>
          )}

          {/* Topic for Thumbnail Titles */}
          {agentId === "thumbnail-titles" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <CharacterLimitTextarea
                value={topic}
                onChange={setTopic}
                maxLength={500}
                placeholder="Which subject do you want to direct the agent to"
              />
              <p className="text-xs text-gray-500 mt-2">
                You can leave this field blank if you don't have a specific direction and want the agent to select it on its own.
              </p>
            </div>
          )}

          {/* Funnel Stage & Tweet Format - Only for Twitter/X Content */}
          {agent.hasFunnelStage && (
            <>
              <Select
                label="Funnel stage"
                showInfo
                options={[
                  { value: "Awareness", label: "Awareness" },
                  { value: "Consideration", label: "Consideration" },
                  { value: "Conversion", label: "Conversion" },
                ]}
                value={funnelStage}
                onChange={setFunnelStage}
              />
              <Select
                label="Tweet Format"
                showInfo
                options={[
                  { value: "Single Tweet", label: "Single Tweet" },
                  { value: "Thread", label: "Thread" },
                ]}
                value={tweetFormat}
                onChange={setTweetFormat}
              />
            </>
          )}

          {/* VSL Sections - Only for VSL agents */}
          {agent.hasVSLSections && (
            <Select
              label="VSL Sections"
              options={VSL_SECTIONS}
              value={vslSection}
              onChange={setVslSection}
            />
          )}

          {/* Generate Button with Language Dropdown */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="relative language-dropdown-container" ref={languageDropdownRef}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed pr-12"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLanguageDropdown(!showLanguageDropdown);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-800 rounded transition-colors flex items-center"
              >
                <span className="text-lg mr-1">{selectedLanguage.flag}</span>
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
              </button>
              {showLanguageDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg mr-3">{lang.flag}</span>
                      <span className="text-sm text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions Section - VSL */}
          {agent.hasVSLSections && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-4">
                      Here you'll learn how to use the Perpetual Conversion Video agent to create professional Video Sales Letters that turn prospects into customers.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Why does this matter?</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      There's an emotional buying formula you must understand:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>People buy based on emotions</li>
                      <li>They justify with logic after the purchase</li>
                      <li>Fear of loss motivates more strongly than promise of gain</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      Understanding the psychology behind each of the 12 VSL sections helps you create persuasive sales videos that overcome buying resistance.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How does it work?</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      The Perpetual Conversion Video follows a 12-section structure:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li><strong>Introduction / Main Surprising Cause:</strong> Hooks attention with an unexpected insight</li>
                      <li><strong>Damaging Admission:</strong> Builds credibility through vulnerability</li>
                      <li><strong>Unique Primary Solution:</strong> Presents your approach as the ideal answer</li>
                      <li><strong>Transition:</strong> Bridges to your specific offer</li>
                      <li><strong>The Solution (Product):</strong> Introduces what you're selling</li>
                      <li><strong>Offer:</strong> Details the complete package</li>
                      <li><strong>CTA + Scarcity:</strong> Creates urgency to act now</li>
                      <li><strong>Bonuses:</strong> Enhances perceived value</li>
                      <li><strong>Guarantee:</strong> Removes risk</li>
                      <li><strong>Urgency:</strong> Reinforces limited-time opportunity</li>
                      <li><strong>Options:</strong> Provides clear purchasing paths</li>
                      <li><strong>Close:</strong> Recaps the biggest emotional benefit</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      Each section is designed to address the 7 common objections buyers have.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Give as much detail as possible about:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your business background</li>
                      <li>Your ideal customer profile</li>
                      <li>The problem your offer solves</li>
                      <li>Your unique solution approach</li>
                      <li>Testimonials and proof points</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700 mb-3">
                      Focus on emotional benefits rather than features. Make sure your offer touches the 8 universal motivations:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Wealth</li>
                      <li>Looks</li>
                      <li>Health</li>
                      <li>Popularity</li>
                      <li>Security</li>
                      <li>Inner peace</li>
                      <li>Free time</li>
                      <li>Fun</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700">
                      Effective VSLs last between 15-30 minutes, allowing enough emotional buildup before presenting the offer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - Ad Funnel */}
          {agent.hasInstructions && agent.id === "ad-funnel" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-4">
                      Here, you create a complete ad sequence: from the first time someone enters your world (Level 5: Unaware) to the final conversion (L1: Fully Aware).
                    </p>
                    <p className="text-sm text-gray-700">
                      If you've studied <em>real</em> copywriting, you might be familiar with Eugene Schwartz's <strong>5 Levels of Awareness</strong> from the book <em>Breakthrough Advertising</em>—a must-read for any serious copywriter.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How does it work?</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      The Ad Funnel follows Eugene Schwartz's 5 Levels of Awareness model (from completely unaware L5 to fully aware L1):
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 ml-4">
                      <li><strong>Totally Unaware (L5):</strong> Doesn't even know they have a problem</li>
                      <li><strong>Problem-Aware (L4):</strong> Knows the problem but isn't looking for a solution</li>
                      <li><strong>Solution-Aware (L3):</strong> Wants to solve the problem now</li>
                      <li><strong>Product-Aware (L2):</strong> Knows about the available solutions</li>
                      <li><strong>Fully Aware (L1):</strong> Has decided, just waiting for the right moment</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">In practice</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      The lower the level, the more unaware the person is about your offer. That means:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Lower chance of immediate purchase</li>
                      <li>Requires more education and awareness building</li>
                      <li>Needs different messaging and approach at each level</li>
                      <li>Each level requires specific copywriting techniques</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      Your ad funnel should guide prospects through each level, moving them from unaware to fully aware and ready to buy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Give as much detail as possible about:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your target audience and their current awareness level</li>
                      <li>The problem you solve</li>
                      <li>Your solution and unique approach</li>
                      <li>Your offer and value proposition</li>
                      <li>Proof points and testimonials</li>
                      <li>Your brand voice and messaging style</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - YouTube Agents */}
          {agent.hasInstructions && ["thumbnail-titles", "youtube-angles", "youtube-description", "youtube-thumbnails", "youtube-titles"].includes(agent.id) && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {agent.id === "thumbnail-titles" && "Create multiple text variations for your YouTube thumbnails to test which ones get the highest click-through rates. The best thumbnails combine compelling text with visual elements."}
                      {agent.id === "youtube-angles" && "Transform any basic idea into multiple engaging video angles. Each angle approaches the topic from a different perspective to maximize appeal and engagement."}
                      {agent.id === "youtube-description" && "Generate SEO-optimized descriptions that help your videos rank better in YouTube search. Include relevant keywords, timestamps, and compelling calls-to-action."}
                      {agent.id === "youtube-thumbnails" && "Get specific suggestions for thumbnail design including text placement, colors, facial expressions, and visual elements that increase clicks."}
                      {agent.id === "youtube-titles" && "Create titles optimized for YouTube's algorithm. Balance keywords, curiosity, and clarity to maximize views and engagement."}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your video topic or main idea</li>
                      <li>Target keywords (if applicable)</li>
                      <li>Your channel's style and tone</li>
                      <li>Any specific requirements or constraints</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - Content Agents */}
          {agent.hasInstructions && ["content-ideas-that-sell", "viral-hooks", "viral-ideas", "viral-scripts"].includes(agent.id) && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {agent.id === "content-ideas-that-sell" && "Generate content ideas that attract customers who are ready to buy. Focus on topics that address pain points and position your solution naturally."}
                      {agent.id === "viral-hooks" && "Create attention-grabbing hooks (6 seconds or less) that stop the scroll. The best hooks create curiosity, promise value, or challenge assumptions."}
                      {agent.id === "viral-ideas" && "Generate highly shareable content ideas based on proven viral patterns. These ideas work across platforms and formats."}
                      {agent.id === "viral-scripts" && "Follow proven structures from the world's most viral videos. These scripts combine hooks, storytelling, and value delivery for maximum engagement."}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your target audience and their interests</li>
                      <li>Your product or service</li>
                      <li>Key messages or topics you want to cover</li>
                      <li>Platform preferences (Instagram, TikTok, YouTube, etc.)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - Email Editor */}
          {agent.hasInstructions && agent.id === "email-editor" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      The Email Editor improves your existing emails by correcting errors, enhancing flow, and optimizing for conversions. Paste your email draft and get an improved version.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your email draft or existing email content</li>
                      <li>Email purpose (promotional, newsletter, follow-up, etc.)</li>
                      <li>Target audience</li>
                      <li>Desired tone and style</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - Landing Pages */}
          {agent.hasInstructions && agent.id === "landing-pages" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Create high-converting landing pages using the 14 essential sections: Hero, Problem, Solution, Benefits, Features, Social Proof, Testimonials, Pricing, FAQ, Guarantee, Urgency, CTA, Footer, and Trust Signals.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your offer or product details</li>
                      <li>Target audience and their pain points</li>
                      <li>Key benefits and features</li>
                      <li>Pricing information</li>
                      <li>Testimonials or proof points</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions Section - SPIN Selling */}
          {agent.hasInstructions && agent.id === "spin-selling" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showInstructions && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      SPIN Selling uses four types of questions: Situation (understand context), Problem (identify pain points), Implication (explore consequences), and Need-payoff (show value of solution). Generate relevant questions for each stage.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What to provide?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Your product or service</li>
                      <li>Target customer profile</li>
                      <li>Common problems you solve</li>
                      <li>Sales context or scenario</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right Panel - Response */}
      <div className="w-1/2 bg-white flex flex-col relative">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-8 py-4 flex-shrink-0">
          <div className="flex space-x-6">
            {[
              { id: "response", label: "Response" },
              { id: "test", label: "Test Report" },
              { id: "history", label: "History" },
              { id: "docos", label: "docOS" },
              { id: "feedback", label: "Feedback" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Response Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {activeTab === "response" && (
              <div>
                {response ? (
                  <div>
                    {/* Copy and Save buttons - Always visible at top */}
                    <div className="mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200 z-10 space-y-3">
                      <h2 className="text-lg font-semibold text-gray-900">Generated Response</h2>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">
                          {countWords(response)} words
                        </p>
                        {dnaContextUsed.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ Using DNA context:</span>
                            <div className="flex flex-wrap gap-1">
                              {dnaContextUsed.map((section, index) => (
                                <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded whitespace-nowrap">
                                  {section}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {dnaContextUsed.length === 0 && (
                          <p className="text-xs text-amber-600">
                            ⚠ No DNA context available - fill in DNA sections for better results
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleCopyOutput}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Copy output content"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Output
                        </button>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          title="Copy formatted text"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Text
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          disabled={!metadata}
                          title="Download test report as HTML"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </button>
                        <button
                          onClick={handleSave}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save to docOS
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="prose prose-sm max-w-none markdown-content">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-base font-bold text-gray-900 mb-2 mt-3" {...props} />,
                            p: ({node, ...props}) => <p className="text-sm text-gray-700 mb-3 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1 ml-4" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside text-sm text-gray-700 mb-3 space-y-1 ml-4" {...props} />,
                            li: ({node, ...props}) => <li className="text-sm text-gray-700 mb-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                            code: ({node, ...props}) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-3" {...props} />,
                          }}
                        >
                          {response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[calc(100vh-200px)]">
                    <div className="text-center w-full max-w-full">
                      {agent.hasVSLSections ? (
                        <p className="text-gray-700 text-lg leading-relaxed">
                          Remember the <strong>41/39/20 Axiom</strong>: the success of a campaign is <strong>41% Target Audience</strong>, <strong>39% Offer</strong>, and only <strong>20% Copy</strong>.
                        </p>
                      ) : (
                        <>
                          <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-400">Click Generate to create your response</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "history" && (
              <div>
                {selectedHistoryItem ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryItem(null)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                      >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        Back to list
                      </button>
                      <p className="text-sm text-gray-500">
                        {selectedHistoryItem.agentName || agent?.name || "Agent"} • {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-auto max-h-[60vh]">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{selectedHistoryItem.content}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResponse(selectedHistoryItem.content);
                          if (selectedHistoryItem.metadata) setMetadata(selectedHistoryItem.metadata);
                          setSelectedHistoryItem(null);
                          setActiveTab("response");
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Use in Response
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedHistoryItem.content);
                            const n = document.createElement("div");
                            n.textContent = "Copied to clipboard";
                            n.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm";
                            document.body.appendChild(n);
                            setTimeout(() => n.remove(), 2000);
                          } catch (_) {}
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">History</h2>
                      <p className="text-sm text-gray-500">
                        {historyItems.length} {historyItems.length === 1 ? "response" : "responses"}
                      </p>
                    </div>
                    {historyItems.length === 0 ? (
                      <div className="text-center text-gray-400 mt-8">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No history yet. Generate responses to see them here.</p>
                        <p className="text-sm mt-2">Each generation is saved automatically.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historyItems.map((item) => (
                          <div
                            key={item.id ?? item.timestamp}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={() => setSelectedHistoryItem(item)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500 mb-1">
                                  {item.agentName || agent?.name || "Agent"} • {new Date(item.timestamp).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {item.content.substring(0, 200)}
                                  {item.content.length > 200 ? "..." : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {activeTab === "docos" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">docOS Documents</h2>
                  <p className="text-sm text-gray-500">
                    {docosDocuments.length} {docosDocuments.length === 1 ? 'document' : 'documents'}
                  </p>
                </div>
                {docosDocuments.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No documents saved yet.</p>
                    <p className="text-sm mt-2">Generate content and click "Save to docOS" to save it here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {docosDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
                        onClick={() => {
                          setResponse(doc.content);
                          setActiveTab("response");
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {doc.agentName || 'Unknown Agent'} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {doc.content.substring(0, 150)}...
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoc(doc.id, doc.title || 'Untitled Document');
                            }}
                            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "test" && (
              <div>
                {metadata && response ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Test Report</h2>
                      <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </button>
                    </div>

                    {/* Metadata Table - Tokens & Time */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">AI Usage Metrics</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Metric</th>
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Agent Name</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900">{metadata.agentName || agent?.name || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Time Taken</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900 font-semibold">{metadata.timeTaken || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Model</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900">{metadata.model || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Provider</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900 capitalize">{metadata.provider || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Tokens (Prompt)</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900">{metadata.tokens?.prompt || 0}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Tokens (Completion)</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900">{metadata.tokens?.completion || 0}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Tokens (Total)</td>
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900 font-semibold text-blue-600">{metadata.tokens?.total || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Raw Input Data */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">1. Raw Input Data</h3>
                        <button
                          onClick={() => {
                            const inputData = JSON.stringify(metadata.rawInput || {}, null, 2);
                            navigator.clipboard.writeText(inputData);
                            const notification = document.createElement("div");
                            notification.textContent = "Input data copied!";
                            notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                            document.body.appendChild(notification);
                            setTimeout(() => notification.remove(), 2000);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase">General Input</label>
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-1">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                              {metadata.rawInput?.generalInput || 'None'}
                            </pre>
                          </div>
                        </div>
                        {metadata.rawInput?.dnaData && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">DNA Data Sections</label>
                            <div className="space-y-3 max-h-96 overflow-auto">
                              {(() => {
                                const sectionNames: Record<string, string> = {
                                  authorBiography: "Author/Company Bio",
                                  idealClientProfile: "Ideal Client Profile",
                                  authorBrandVoice: "Brand Voice",
                                  buyingProfile: "Buying Profile",
                                  persuasivePremise: "Persuasive Premise",
                                  falseBeliefs: "False Beliefs to Address",
                                  productOfferUVP: "Product/Offer/UVP",
                                  proofs: "Proofs",
                                  testimonials: "Testimonials",
                                  theProblem: "The Problem",
                                  theSolution: "The Solution",
                                };
                                
                                const getContent = (section: any) => {
                                  if (!section) return null;
                                  if (typeof section === 'string') return section;
                                  if (section.content) return section.content;
                                  return null;
                                };
                                
                                return Object.entries(metadata.rawInput.dnaData).map(([sectionId, sectionData]) => {
                                  const content = getContent(sectionData);
                                  if (!content || !content.trim()) return null;
                                  
                                  const sectionName = sectionNames[sectionId] || sectionId;
                                  return (
                                    <div key={sectionId} className="bg-gray-50 border border-gray-200 rounded p-3">
                                      <div className="text-xs font-semibold text-gray-900 mb-2">{sectionName}</div>
                                      <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {content}
                                      </div>
                                    </div>
                                  );
                                }).filter(Boolean);
                              })()}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {metadata.rawInput?.vslSection && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">VSL Section</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.vslSection}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.funnelStage && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Funnel Stage</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.funnelStage}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.tweetFormat && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Tweet Format</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.tweetFormat}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.keywords && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Keywords</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.keywords}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.topic && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Topic</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.topic}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.language && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Language</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.language}
                              </div>
                            </div>
                          )}
                          {metadata.rawInput?.targetSectionId && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase">Target Section ID</label>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-sm text-gray-700">
                                {metadata.rawInput.targetSectionId}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">2. System Prompt (Sent to AI)</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(metadata.systemPrompt || '');
                            const notification = document.createElement("div");
                            notification.textContent = "System prompt copied!";
                            notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                            document.body.appendChild(notification);
                            setTimeout(() => notification.remove(), 2000);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-60 overflow-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{metadata.systemPrompt || 'N/A'}</pre>
                      </div>
                    </div>

                    {/* User Prompt - Constructed from Input */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">3. User Prompt (Constructed from Input)</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(metadata.prompt || '');
                            const notification = document.createElement("div");
                            notification.textContent = "User prompt copied!";
                            notification.className = "fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                            document.body.appendChild(notification);
                            setTimeout(() => notification.remove(), 2000);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{metadata.prompt || 'N/A'}</pre>
                      </div>
                    </div>

                    {/* Generated Output */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">4. Generated Output (From AI)</h3>
                        <button
                          onClick={handleCopyOutput}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Output
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-auto">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4" {...props} />,
                              p: ({node, ...props}) => <p className="text-sm text-gray-700 mb-3 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1 ml-4" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-sm text-gray-700 mb-3 space-y-1 ml-4" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                            }}
                          >
                            {response}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 mt-8">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No test data available yet.</p>
                    <p className="text-sm mt-2">Generate content to see test report with input, prompts, output, tokens, and time.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "feedback" && (
              <div className="text-center text-gray-400 mt-8">
                <p>Feedback section - Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        onConfirm={confirmDeleteDoc}
        title="Delete Document"
        message="Are you sure you want to delete this document from docOS?"
        itemName={docToDelete?.title}
        confirmText="Delete Document"
        cancelText="Cancel"
      />
    </div>
  );
}
