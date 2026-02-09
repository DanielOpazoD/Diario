import React, { useCallback, useEffect, useRef } from 'react';
import { sanitizeRichText } from '@shared/utils/richTextSanitization';

interface RichTextEditorProps {
  value: string;
  className?: string;
  ariaLabel?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  className,
  ariaLabel,
  onChange,
  onFocus,
  onBlur,
}) => {
  const noteRef = useRef<HTMLDivElement>(null);

  const syncContent = useCallback(() => {
    const node = noteRef.current;
    if (!node) return;
    const sanitized = sanitizeRichText(value || '');
    if (node.innerHTML !== sanitized) {
      node.innerHTML = sanitized;
    }
  }, [value]);

  useEffect(() => {
    syncContent();
  }, [syncContent]);

  const handleInput = useCallback(() => {
    const node = noteRef.current;
    if (!node) return;
    const sanitized = sanitizeRichText(node.innerHTML);
    onChange(sanitized);
  }, [onChange]);

  return (
    <div
      ref={noteRef}
      className={className}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      onInput={handleInput}
      onBlur={(event) => {
        const sanitized = sanitizeRichText(event.currentTarget.innerHTML);
        if (sanitized !== event.currentTarget.innerHTML) {
          event.currentTarget.innerHTML = sanitized;
        }
        onChange(sanitized);
        onBlur?.();
      }}
      onFocus={() => {
        onFocus?.();
        syncContent();
      }}
    />
  );
};

export default RichTextEditor;
