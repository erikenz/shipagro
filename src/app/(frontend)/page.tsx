import { redirect } from 'next/navigation'

// The Payload admin is the only UI (docs/architecture.md).
export default function HomePage() {
  redirect('/admin')
}
