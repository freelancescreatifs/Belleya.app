import BelayaLoader from './BelayaLoader';

export default function LoadingScreen({ message }: { message?: string }) {
  return <BelayaLoader variant="full" message={message} />;
}
