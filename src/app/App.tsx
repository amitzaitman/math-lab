import { useRegisterSW } from 'virtual:pwa-register/react';
import { EquivalentFractions } from '../activities/equivalent-fractions/EquivalentFractions';
export function App() {
  const {needRefresh: [needRefresh], updateServiceWorker} = useRegisterSW();
  return <>
    <header className="header"><a href={import.meta.env.BASE_URL} className="brand"><span aria-hidden="true">◒</span> מעבדת החשבון <small>Math Lab</small></a><span className="tag">לגעת. לגלות. להבין.</span></header>
    <main><EquivalentFractions /></main>
    <footer>רעיונות גדולים, בצעדים קטנים.</footer>
    {needRefresh && <aside className="update" role="status">גרסה חדשה מוכנה. העדכון יתחיל את הפעילות מחדש. <button onClick={() => void updateServiceWorker(true)}>עדכון</button></aside>}
  </>;
}
