'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import StudentNav from './StudentNav';

interface StudentSidebarProps {
  email: string;
}

export default function StudentSidebar({ email }: StudentSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <p className="text-base font-semibold text-foreground">Withstady</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              メニュー
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 p-6">
            <SheetHeader>
              <SheetTitle>学習メニュー</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Withstady</p>
              <p className="text-sm text-muted-foreground">
                学習を見える化しながら AI チューターと学び続けましょう。
              </p>
            </div>
            <StudentNav email={email} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r bg-background/95 px-6 py-8 backdrop-blur lg:flex">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Withstady</p>
          <p className="text-sm text-muted-foreground">
            学習を見える化しながら AI チューターと学び続けましょう。
          </p>
        </div>
        <div className="mt-8 flex flex-1 flex-col">
          <StudentNav email={email} />
        </div>
      </aside>
    </>
  );
}
