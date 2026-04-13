import { redirect } from 'next/navigation';

export default function BusinessProjectsPage() {
  redirect('/business?module=projects');
}
