import AppTabs from '@/components/app-tabs';
import { PromocionesProvider } from '@/contexts/promociones-context';

export default function TabsLayout() {
  return (
    <PromocionesProvider>
      <AppTabs />
    </PromocionesProvider>
  );
}
