import { useRegisterSW } from 'virtual:pwa-register/react';
import { EquivalentFractions } from '../activities/equivalent-fractions/EquivalentFractions';
export function App() {
  const {needRefresh: [needRefresh], updateServiceWorker} = useRegisterSW();
  return <>
    <main><EquivalentFractions /></main>
    {needRefresh && <aside className="update" role="status">גרסה חדשה מוכנה. העדכון יתחיל את הפעילות מחדש. <button onClick={() => void updateServiceWorker(true)}>עדכון</button></aside>}
  </>;
}
