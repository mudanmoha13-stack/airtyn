import { redirect } from 'next/navigation';

export default function BusinessFinancePage() {
  redirect('/business?module=finance');
}
