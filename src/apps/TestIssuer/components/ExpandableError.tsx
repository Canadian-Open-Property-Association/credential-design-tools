/**
 * Expandable Error Display
 *
 * Shows an error message with expandable details showing
 * the full API request and response for debugging.
 */

import { useState } from 'react';

/**
 * Detailed error information from an API call
 */
export interface ApiErrorDetails {
  /** Error message */
  message: string;

  /** Timestamp of the error */
  timestamp: string;

  /** The API endpoint URL that was called */
  requestUrl: string;

  /** HTTP method used */
  requestMethod: string;

  /** The payload sent to the API */
  requestPayload?: Record<string, unknown>;

  /** HTTP status code from the response */
  statusCode?: number;

  /** The raw response body */
  responseBody?: string;
}

interface ExpandableErrorProps {
  /** Simple error message to display */
  message: string;

  /** Detailed error information */
  details?: ApiErrorDetails | null;

  /** Callback to dismiss the error */
  onDismiss: () => void;
}

/**
 * Format a date string for display
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Try to pretty-print JSON, fallback to raw string
 */
function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export default function ExpandableError({
  message,
  details,
  onDismiss,
}: ExpandableErrorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
      {/* Error Header */}
      <div className="p-3 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-700 mt-0.5">{message}</p>

          {/* Show Details Toggle */}
          {details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {isExpanded ? 'Hide API Details' : 'Show API Details'}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && details && (
        <div className="border-t border-red-200 bg-red-100/50 p-4 space-y-3">
          {/* Timestamp */}
          <div className="text-xs">
            <span className="text-red-600 font-medium">Timestamp:</span>
            <span className="ml-2 text-red-800">{formatDateTime(details.timestamp)}</span>
          </div>

          {/* Status Code */}
          {details.statusCode && (
            <div className="text-xs">
              <span className="text-red-600 font-medium">Status Code:</span>
              <span className="ml-2 text-red-800">{details.statusCode}</span>
            </div>
          )}

          {/* Request URL */}
          <div className="text-xs">
            <span className="text-red-600 font-medium">Request:</span>
            <code className="block mt-1 p-2 bg-white rounded border border-red-200 text-red-800 text-xs font-mono break-all">
              {details.requestMethod} {details.requestUrl}
            </code>
          </div>

          {/* Request Payload */}
          {details.requestPayload && Object.keys(details.requestPayload).length > 0 && (
            <div className="text-xs">
              <span className="text-red-600 font-medium">Request Payload:</span>
              <pre className="mt-1 p-2 bg-white rounded border border-red-200 text-red-800 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(details.requestPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Body */}
          {details.responseBody && (
            <div className="text-xs">
              <span className="text-red-600 font-medium">Response Body:</span>
              <pre className="mt-1 p-2 bg-white rounded border border-red-200 text-red-800 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                {formatJson(details.responseBody)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
