import { StoreProvider } from '@/lib/store';
import AppLogic from '@/components/AppLogic';

export default function AppPage() {
  return (
    <StoreProvider>
      <AppLogic />
    </StoreProvider>
  );
}
