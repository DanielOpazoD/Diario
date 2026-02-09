import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InlineEditorPane from '../../src/core/patient/components/InlineEditorPane';

describe('InlineEditorPane', () => {
  it('renders children within the wrapper structure', () => {
    render(
      <InlineEditorPane>
        <div data-testid="pane-child">Contenido</div>
      </InlineEditorPane>
    );

    const child = screen.getByTestId('pane-child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Contenido');
  });
});
