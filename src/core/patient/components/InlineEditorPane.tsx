import React from 'react';

interface InlineEditorPaneProps {
    children: React.ReactNode;
}

/**
 * A unified wrapper component for all inline editor module content.
 * Ensures consistent width and prevents layout expansion from internal components.
 */
const InlineEditorPane: React.FC<InlineEditorPaneProps> = ({ children }) => (
    <div className="w-full max-w-full overflow-hidden">
        <div className="w-full">{children}</div>
    </div>
);

export default React.memo(InlineEditorPane);
