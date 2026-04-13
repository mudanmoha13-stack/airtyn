import { redirect } from 'next/navigation';

export default function BusinessHrPage() {
  redirect('/business?module=hr');
}
