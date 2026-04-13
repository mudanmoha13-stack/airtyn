import { redirect } from 'next/navigation';

export default function BusinessSupportPage() {
  redirect('/business?module=support');
}
