import { useRegisterSW } from 'virtual:pwa-register/react';
import { Lab } from '../lab/Lab';
export function App() {
  const {needRefresh: [needRefresh], updateServiceWorker} = useRegisterSW();
  return <>
    <Lab />
    {needRefresh && <aside className="update" role="status">גרסה חדשה מוכנה. העדכון יתחיל את הפעילות מחדש. <button onClick={() => void updateServiceWorker(true)}>עדכון</button></aside>}
  </>;
}
