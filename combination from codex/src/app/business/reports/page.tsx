import { redirect } from 'next/navigation';

export default function BusinessReportsPage() {
  redirect('/business?module=analytics');
}
