import ChatDashboard from '../../../_components/ChatDashboard';
import type { SubjectId } from '../../../../lib/studentContext';
import { loadClientStudent } from '../_utils';

const SUBJECT_ID: SubjectId = 'japanese';

export default async function JapaneseChatPage() {
  const student = await loadClientStudent();

  return <ChatDashboard student={student} subjectId={SUBJECT_ID} />;
}
