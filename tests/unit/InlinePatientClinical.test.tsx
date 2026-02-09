import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlinePatientClinical from '@core/patient/components/InlinePatientClinical';

const clinicalNoteSpy = vi.fn();

vi.mock('@core/patient/components/ClinicalNote', () => ({
  default: (props: any) => {
    clinicalNoteSpy(props);
    return <div data-testid="clinical-note" />;
  },
}));

describe('InlinePatientClinical', () => {
  it('passes props to ClinicalNote', () => {
    render(
      <InlinePatientClinical
        diagnosis="Dx"
        clinicalNote="Nota"
        pendingTasks={[]}
        isListening={false}
        isAnalyzing={false}
        isSummarizing={false}
        attachmentsCount={2}
        onDiagnosisChange={vi.fn()}
        onClinicalNoteChange={vi.fn()}
        onToggleListening={vi.fn()}
        onAnalyze={vi.fn()}
        onSummary={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTask={vi.fn()}
        onUpdateTaskNote={vi.fn()}
      />
    );

    expect(screen.getByTestId('clinical-note')).toBeInTheDocument();
    expect(clinicalNoteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnosis: 'Dx',
        clinicalNote: 'Nota',
        activeTab: 'clinical',
        attachmentsCount: 2,
        minimal: true,
      })
    );
  });
});
