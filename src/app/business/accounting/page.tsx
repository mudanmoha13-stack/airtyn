import { redirect } from 'next/navigation';

export default function BusinessAccountingPage() {
  redirect('/business?module=finance');
}
