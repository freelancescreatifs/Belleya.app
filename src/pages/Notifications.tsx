import NotificationCenter from '../components/dashboard/NotificationCenter';

export default function Notifications() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <NotificationCenter compact={false} />
    </div>
  );
}
