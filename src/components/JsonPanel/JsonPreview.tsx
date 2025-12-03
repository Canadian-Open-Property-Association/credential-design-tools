import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useVctStore } from '../../store/vctStore';
import { isLegacyFormat, isFrontBackFormat, VCTSvgTemplate } from '../../types/vct';

export default function JsonPreview() {
  const currentVct = useVctStore((state) => state.currentVct);
  const [copied, setCopied] = useState(false);

  // Clean up the VCT object for export (remove empty optional fields)
  const cleanVct = () => {
    const cleaned: Record<string, unknown> = {
      vct: currentVct.vct,
      name: currentVct.name,
    };

    if (currentVct.description) {
      cleaned.description = currentVct.description;
    }

    if (currentVct.extends) {
      cleaned.extends = currentVct.extends;
      if (currentVct['extends#integrity']) {
        cleaned['extends#integrity'] = currentVct['extends#integrity'];
      }
    }

    if (currentVct.schema_uri) {
      cleaned.schema_uri = currentVct.schema_uri;
      if (currentVct['schema_uri#integrity']) {
        cleaned['schema_uri#integrity'] = currentVct['schema_uri#integrity'];
      }
    }

    // Clean display array
    cleaned.display = currentVct.display.map((d) => {
      const display: Record<string, unknown> = {
        locale: d.locale,
        name: d.name,
      };

      if (d.description) {
        display.description = d.description;
      }

      if (d.rendering) {
        const rendering: Record<string, unknown> = {};

        if (d.rendering.simple) {
          const simple: Record<string, unknown> = {};

          if (d.rendering.simple.background_color) {
            simple.background_color = d.rendering.simple.background_color;
          }
          if (d.rendering.simple.text_color) {
            simple.text_color = d.rendering.simple.text_color;
          }
          if (d.rendering.simple.font_family) {
            simple.font_family = d.rendering.simple.font_family;
          }

          if (d.rendering.simple.logo?.uri) {
            simple.logo = {
              uri: d.rendering.simple.logo.uri,
              ...(d.rendering.simple.logo['uri#integrity'] && {
                'uri#integrity': d.rendering.simple.logo['uri#integrity'],
              }),
              ...(d.rendering.simple.logo.alt_text && {
                alt_text: d.rendering.simple.logo.alt_text,
              }),
            };
          }

          if (d.rendering.simple.background_image?.uri) {
            simple.background_image = {
              uri: d.rendering.simple.background_image.uri,
              ...(d.rendering.simple.background_image['uri#integrity'] && {
                'uri#integrity': d.rendering.simple.background_image['uri#integrity'],
              }),
            };
          }

          if (Object.keys(simple).length > 0) {
            rendering.simple = simple;
          }
        }

        // Handle svg_templates (both legacy array and COPA front/back formats)
        if (d.rendering.svg_templates) {
          const cleanTemplate = (t: VCTSvgTemplate) => {
            const template: Record<string, unknown> = {
              uri: t.uri,
            };
            if (t['uri#integrity']) {
              template['uri#integrity'] = t['uri#integrity'];
            }
            if (t.properties) {
              const props: Record<string, unknown> = {};
              if (t.properties.orientation) props.orientation = t.properties.orientation;
              if (t.properties.color_scheme) props.color_scheme = t.properties.color_scheme;
              if (t.properties.contrast) props.contrast = t.properties.contrast;
              if (Object.keys(props).length > 0) {
                template.properties = props;
              }
            }
            return template;
          };

          if (isLegacyFormat(d.rendering.svg_templates)) {
            // Legacy array format
            const filtered = d.rendering.svg_templates.filter((t: VCTSvgTemplate) => t.uri);
            if (filtered.length > 0) {
              rendering.svg_templates = filtered.map((t: VCTSvgTemplate) => cleanTemplate(t));
            }
          } else if (isFrontBackFormat(d.rendering.svg_templates)) {
            // COPA front/back format
            const templates: Record<string, unknown> = {};
            if (d.rendering.svg_templates.front?.uri) {
              templates.front = cleanTemplate(d.rendering.svg_templates.front);
            }
            if (d.rendering.svg_templates.back?.uri) {
              templates.back = cleanTemplate(d.rendering.svg_templates.back);
            }
            if (Object.keys(templates).length > 0) {
              rendering.svg_templates = templates;
            }
          }
        }

        // Handle card_elements (COPA standard)
        if (d.card_elements) {
          const cardElements: Record<string, unknown> = {};

          if (d.card_elements.front) {
            const front: Record<string, unknown> = {};
            for (const [key, element] of Object.entries(d.card_elements.front)) {
              if (element && (element.claim_path || element.value || element.logo_uri)) {
                // Clean the element - only include non-empty fields
                const cleanedElement: Record<string, unknown> = {};
                if (element.position) cleanedElement.position = element.position;
                if (element.claim_path) cleanedElement.claim_path = element.claim_path;
                if (element.value) cleanedElement.value = element.value;
                if (element.label) cleanedElement.label = element.label;
                if (element.logo_uri) cleanedElement.logo_uri = element.logo_uri;
                front[key] = cleanedElement;
              }
            }
            if (Object.keys(front).length > 0) {
              cardElements.front = front;
            }
          }

          if (d.card_elements.back) {
            const back: Record<string, unknown> = {};
            if (d.card_elements.back.metadata && d.card_elements.back.metadata.fields.length > 0) {
              back.metadata = d.card_elements.back.metadata;
            }
            if (d.card_elements.back.evidence && d.card_elements.back.evidence.sources.length > 0) {
              back.evidence = d.card_elements.back.evidence;
            }
            if (Object.keys(back).length > 0) {
              cardElements.back = back;
            }
          }

          if (Object.keys(cardElements).length > 0) {
            display.card_elements = cardElements;
          }
        }

        if (Object.keys(rendering).length > 0) {
          display.rendering = rendering;
        }
      }

      return display;
    });

    // Clean claims array
    if (currentVct.claims.length > 0) {
      const cleanedClaims = currentVct.claims
        .filter((c) => c.path.some((p) => p)) // Only include claims with at least one path segment
        .map((c) => {
          const claim: Record<string, unknown> = {
            path: c.path.filter((p) => p !== null && p !== ''), // Remove empty path segments
            display: c.display
              .filter((d) => d.label) // Only include displays with labels
              .map((d) => ({
                locale: d.locale,
                label: d.label,
                ...(d.description && { description: d.description }),
              })),
          };

          // Add optional claim properties
          if (c.mandatory !== undefined && c.mandatory !== false) {
            claim.mandatory = c.mandatory;
          }
          if (c.sd && c.sd !== 'allowed') {
            claim.sd = c.sd;
          }
          if (c.svg_id) {
            claim.svg_id = c.svg_id;
          }

          return claim;
        });

      if (cleanedClaims.length > 0) {
        cleaned.claims = cleanedClaims;
      }
    }

    return cleaned;
  };

  const jsonString = JSON.stringify(cleanVct(), null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentVct.name || 'vct'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action buttons */}
      <div className="flex gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
        >
          Download JSON
        </button>
      </div>

      {/* JSON content */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.75rem',
            lineHeight: '1.5',
          }}
          wrapLines
          wrapLongLines
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
