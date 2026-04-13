import { redirect } from 'next/navigation';

export default function BusinessInventoryPage() {
  redirect('/business?module=inventory');
}
