import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';


import { Button, BookmarkIcon } from '@core/ui';
import AppearanceSettings from '@features/settings/AppearanceSettings';

describe('UI Snapshots', () => {
    it('renders Button correctly (primary)', () => {
        const { asFragment } = render(<Button variant="primary">Click Me</Button>);
        expect(asFragment()).toMatchSnapshot();
    });

    it('renders Button correctly (ai)', () => {
        const { asFragment } = render(<Button variant="ai">AI Magic</Button>);
        expect(asFragment()).toMatchSnapshot();
    });

    it('renders Button correctly (loading)', () => {
        const { asFragment } = render(<Button isLoading>Loading...</Button>);
        expect(asFragment()).toMatchSnapshot();
    });

    it('renders BookmarkIcon correctly (custom emoji)', () => {
        const bookmark = { url: 'https://example.com', icon: '🩺' };
        const { asFragment } = render(<BookmarkIcon bookmark={bookmark} />);
        expect(asFragment()).toMatchSnapshot();
    });

    it('renders BookmarkIcon correctly (favicon - fallback mode)', () => {
        const bookmark = { url: 'https://google.com', icon: '' };
        const { asFragment } = render(<BookmarkIcon bookmark={bookmark} />);
        expect(asFragment()).toMatchSnapshot();
    });

    it('renders AppearanceSettings correctly', () => {
        const { asFragment } = render(<AppearanceSettings theme="light" onToggleTheme={() => { }} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
