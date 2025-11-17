import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
}

export default function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  if (!items.length) {
    return null;
  }

  return (
    <ul className="space-y-4" aria-label="Onboarding checklist">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span
            role="status"
            aria-label={item.done ? 'completed' : 'pending'}
            className={item.done ? 'text-green-500 mt-1' : 'text-gray-400 mt-1'}
          >
            {item.done ? <FaCheckCircle aria-hidden /> : <FaRegCircle aria-hidden />}
          </span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
