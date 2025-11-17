import { render, screen } from '@testing-library/react';
import OnboardingChecklist, { ChecklistItem } from './OnboardingChecklist';

describe('OnboardingChecklist', () => {
  const items: ChecklistItem[] = [
    { id: 'resume', title: 'Upload a resume', description: 'PDF, DOCX, TXT or MD', done: false },
    { id: 'photos', title: 'Add portfolio photos', description: 'Up to 3 brand shots', done: true },
  ];

  it('renders all checklist entries', () => {
    render(<OnboardingChecklist items={items} />);

    expect(screen.getByLabelText('Onboarding checklist')).toBeInTheDocument();
    expect(screen.getByText('Upload a resume')).toBeVisible();
    expect(screen.getByText('Add portfolio photos')).toBeVisible();
  });

  it('marks completed steps', () => {
    render(<OnboardingChecklist items={items} />);
    const completed = screen.getAllByRole('status', { name: 'completed' });
    expect(completed).toHaveLength(1);
  });

  it('returns null when empty', () => {
    const { container } = render(<OnboardingChecklist items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
