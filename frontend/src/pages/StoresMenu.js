import { Link } from 'react-router-dom';
import { Store, Factory } from 'lucide-react';

export default function StoresMenu() {
  const stores = [
    { id: 'factory', name: 'Factory', icon: Factory },
    { id: 'store1', name: 'Store 1', icon: Store },
    { id: 'store2', name: 'Store 2', icon: Store },
    { id: 'store3', name: 'Store 3', icon: Store },
  ];

  return (
    <div data-testid="stores-menu-page">
      <div className="page-header"><h2>Stores & Factory</h2><p>Select a location to manage</p></div>

      <div className="stores-grid">
        {stores.map(store => (
          <Link key={store.id} to={`/stores/${store.id}/production`} className="store-card" data-testid={`store-card-${store.id}`}>
            <div className="store-icon"><store.icon size={48} /></div>
            <h3>{store.name}</h3>
            <p>View production tasks</p>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .stores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 32px; }
        .store-card { background: white; border-radius: 16px; padding: 48px 32px; text-align: center; text-decoration: none; color: inherit; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); transition: transform 0.2s, box-shadow 0.2s; }
        .store-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15); }
        .store-icon { width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; }
        .store-card h3 { font-size: 24px; color: #2d3748; margin-bottom: 8px; }
        .store-card p { color: #718096; font-size: 14px; }
      `}</style>
    </div>
  );
}
