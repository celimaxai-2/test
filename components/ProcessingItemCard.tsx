import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ImageIcon } from "lucide-react";
import type { ProcessedItem } from "../types.ts";

interface Props {
  item: ProcessedItem;
}

export function ProcessingItemCard({ item }: Props) {
  const statusConfig = {
    pending: {
      icon: <ImageIcon className="w-4 h-4 text-gray-400" />,
      label: "대기 중",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-500",
    },
    processing: {
      icon: <Loader2 className="w-4 h-4 text-alipay-500 animate-spin" />,
      label: "분석 중...",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      label: "완료",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-600",
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      label: "오류",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
    },
  };

  const config = statusConfig[item.status];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all duration-300`}
    >
      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white border border-gray-200">
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {item.file.name}
        </p>
        <p className={`text-xs mt-0.5 ${config.textColor}`}>
          {item.error || config.label}
        </p>
      </div>

      <div className="flex-shrink-0">{config.icon}</div>
    </div>
  );
}
