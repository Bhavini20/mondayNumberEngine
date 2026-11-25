import { Shell } from './components/Shell';
import { useDemo } from './state/demoStore';
import { Start } from './screens/Start';
import { AnalystView } from './screens/analyst/AnalystView';
import { FounderReport } from './screens/founder/FounderReport';

export function App() {
  const { state } = useDemo();
  return (
    <Shell>
      {state.screen === 'start' && <Start />}
      {state.screen === 'analyst' && <AnalystView />}
      {state.screen === 'founder' && <FounderReport />}
    </Shell>
  );
}
