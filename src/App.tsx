import { DashboardProvider } from './context/DashboardContext';
import { Dashboard, Header, ConfigPanel } from './components';
import './styles/index.css';

function App() {
  return (
    <DashboardProvider>
      <div className="app">
        <Header />
        <Dashboard />
        <ConfigPanel />
      </div>
    </DashboardProvider>
  );
}

export default App;
