import ChatDashboard from '../../../_components/ChatDashboard';
import type { SubjectId } from '../../../../lib/studentContext';
import { loadClientStudent } from '../_utils';

const SUBJECT_ID: SubjectId = 'science';

export default async function ScienceChatPage() {
  const student = await loadClientStudent();

  return <ChatDashboard student={student} subjectId={SUBJECT_ID} />;
}
