import React, { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Upload,
  ImagePlus,
  Key,
  Trash2,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { extractDataFromImage } from "./services/geminiService.ts";
import { ProcessingItemCard } from "./components/ProcessingItemCard.tsx";
import { ResultTable } from "./components/ResultTable.tsx";
import type { ProcessedItem } from "./types.ts";

const API_KEY_STORAGE = "alipay-scan-gemini-key";

export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem(API_KEY_STORAGE) || ""
  );
  const [showKey, setShowKey] = useState(false);
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  };

  const processImage = useCallback(
    async (item: ProcessedItem) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "processing" as const } : i
        )
      );

      try {
        const data = await extractDataFromImage(apiKey, item.file);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "success" as const, data }
              : i
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error" as const,
                  error: err.message || "추출 실패",
                }
              : i
          )
        );
      }
    },
    [apiKey]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (!apiKey) {
        alert("먼저 Gemini API 키를 입력해주세요.");
        return;
      }

      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) return;

      const newItems: ProcessedItem[] = imageFiles.map((file) => ({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
        data: null,
        error: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => processImage(item));
    },
    [apiKey, processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  const processingCount = items.filter(
    (i) => i.status === "processing"
  ).length;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-alipay-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Alipay Scan & Sheet
            </h1>
            <p className="text-xs text-gray-500">
              알리페이 거래 스크린샷 → 스프레드시트
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <div className="relative">
            <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="Gemini API Key"
              className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-alipay-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Upload & Status */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          {/* Drop Zone */}
          <div className="p-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "drop-zone-active"
                  : "border-gray-300 hover:border-alipay-500 hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2">
                {isDragging ? (
                  <Upload className="w-10 h-10 text-alipay-500" />
                ) : (
                  <ImagePlus className="w-10 h-10 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging
                      ? "여기에 놓으세요!"
                      : "이미지를 드래그하거나 클릭"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WEBP 지원 · 여러 장 가능
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {items.length > 0 && (
            <div className="px-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">
                  전체 <span className="font-semibold">{items.length}</span>
                </span>
                {processingCount > 0 && (
                  <span className="text-blue-600">
                    처리 중{" "}
                    <span className="font-semibold">{processingCount}</span>
                  </span>
                )}
                {successCount > 0 && (
                  <span className="text-emerald-600">
                    완료 <span className="font-semibold">{successCount}</span>
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-600">
                    오류 <span className="font-semibold">{errorCount}</span>
                  </span>
                )}
              </div>
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                title="전체 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
            {items.map((item) => (
              <ProcessingItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Right Panel - Results Table */}
        <div className="flex-1 p-6 overflow-hidden">
          <ResultTable items={items} />
        </div>
      </div>
    </div>
  );
}
