import { StoreProvider } from '@/lib/store';
import AppLogic from '@/components/AppLogic';

export default function Home() {
  return (
    <StoreProvider>
      <AppLogic />
    </StoreProvider>
  );
}
