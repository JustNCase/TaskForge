interface AIResponseProps {
  content: string;
  confidence?: number;
}

export function AIResponse({ content, confidence }: AIResponseProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <p className="text-sm text-gray-700">{content}</p>
      {confidence !== undefined && (
        <p className="text-xs text-gray-400 mt-2">
          Confidence: {Math.round(confidence * 100)}%
        </p>
      )}
    </div>
  );
}
