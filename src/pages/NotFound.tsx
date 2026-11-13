import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      action={
        <Link to="/">
          <Button>Back to dashboard</Button>
        </Link>
      }
      className="py-24"
    />
  );
}
