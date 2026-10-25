import { ContactForm } from '@/components/panel/forms/contact-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent } from '@/components/ui/card'

export default function NuevoContactoPage() {
  return (
    <>
      <PageHeader title="Nuevo Contacto" back={{ href: '/contactos', label: 'Contactos' }} />
      <Card className="max-w-3xl">
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </>
  )
}
