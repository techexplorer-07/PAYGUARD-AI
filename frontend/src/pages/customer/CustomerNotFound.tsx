import { Link } from 'react-router';
import { Card } from '../../components/customer/CustomerPrimitives';
import { secondaryButtonClass } from '../../components/customer/customerUi';

export function CustomerNotFound() {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-ink-muted">The page you are looking for does not exist.</p>
      <Link to="/" className={`${secondaryButtonClass} mt-6`}>
        Back to dashboard
      </Link>
    </Card>
  );
}
