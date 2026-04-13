import { redirect } from 'next/navigation';

export default function BusinessProcurementPage() {
  redirect('/business?module=procurement');
}
