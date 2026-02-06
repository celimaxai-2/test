import React, { useMemo } from "react";
import { Copy, CheckCircle2, TableIcon } from "lucide-react";
import type { ProcessedItem } from "../types.ts";

interface Props {
  items: ProcessedItem[];
}

const COLUMNS = [
  { key: "date", label: "날짜", width: "min-w-[150px]" },
  { key: "amount", label: "금액 (CNY)", width: "min-w-[110px]" },
  { key: "merchant", label: "상점", width: "min-w-[140px]" },
  { key: "productName", label: "상품명", width: "min-w-[160px]" },
  { key: "status", label: "상태", width: "min-w-[100px]" },
  { key: "paymentMethod", label: "결제 수단", width: "min-w-[120px]" },
  { key: "transactionId", label: "거래 ID", width: "min-w-[200px]" },
] as const;

export function ResultTable({ items }: Props) {
  const [copied, setCopied] = React.useState(false);

  const successItems = useMemo(
    () => items.filter((item) => item.status === "success" && item.data),
    [items]
  );

  const totalAmount = useMemo(() => {
    return successItems.reduce((sum, item) => {
      const amount = parseFloat(item.data!.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [successItems]);

  const handleCopy = async () => {
    const headers = COLUMNS.map((col) => col.label).join("\t");
    const rows = successItems.map((item) =>
      COLUMNS.map((col) => item.data![col.key as keyof typeof item.data] || "").join("\t")
    );
    const tsv = [headers, ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = tsv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <TableIcon className="w-16 h-16 stroke-1" />
        <div className="text-center">
          <p className="text-lg font-medium">결과 테이블</p>
          <p className="text-sm mt-1">
            이미지를 업로드하면 추출된 데이터가 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          추출 결과{" "}
          <span className="text-sm font-normal text-gray-500">
            ({successItems.length}건)
          </span>
        </h2>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">복사 완료!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>클립보드 복사</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {successItems.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/40 transition-colors"
              >
                <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">
                  {index + 1}
                </td>
                {COLUMNS.map((col) => {
                  const value =
                    item.data![col.key as keyof typeof item.data] || "";
                  const isAmount = col.key === "amount";
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 ${
                        isAmount
                          ? "font-mono font-semibold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {isAmount && value ? `¥${value}` : value || "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0">
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                합계
              </td>
              <td className="px-3 py-2.5 font-mono font-bold text-alipay-600 text-base">
                ¥{totalAmount.toFixed(2)}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
