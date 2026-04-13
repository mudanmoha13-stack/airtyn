import { redirect } from 'next/navigation';

export default function BusinessPurchasesPage() {
  redirect('/business?module=procurement');
}
