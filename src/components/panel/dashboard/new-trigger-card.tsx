import { Plus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function NewTriggerCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo precio gatillo</CardTitle>
        <CardDescription>Lo que te pidió el Contacto, en un solo lugar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
          <span className="text-xs font-medium uppercase tracking-wide opacity-80">De la conversación al seguimiento</span>
          <p className="text-sm leading-relaxed">
            Registrá el Instrumento, el Precio objetivo y las condiciones de entrega. Te avisamos cuando el mercado se
            acerque.
          </p>
          <Button asChild className="self-start">
            <Link href="/gatillos/nuevo">
              <Plus aria-hidden="true" />
              Cargar precio gatillo
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Revisás los datos antes de guardar. No se envían órdenes.</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Cada oportunidad, con su Responsable.</span>
        <Link href="/gatillos" className="font-medium text-foreground hover:underline">
          Ver precios gatillo
        </Link>
      </CardFooter>
    </Card>
  )
}
