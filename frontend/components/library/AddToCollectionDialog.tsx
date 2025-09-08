"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Label } from "@/components/ui/Label";
import { useT } from "@/components/providers/AppProviders";

interface AddToCollectionDialogProps {
  collections: { id: number; name: string }[];
  onConfirm: (collectionId: number) => void;
  onCancel: () => void;
}

export function AddToCollectionDialog({
  collections,
  onConfirm,
  onCancel,
}: AddToCollectionDialogProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const t = useT();

  const handleConfirm = () => {
    if (selectedCollection) {
      onConfirm(parseInt(selectedCollection, 10));
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-slate-500 border-slate-500">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("addToCollection")}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {t("selectCollectionPrompt")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 max-h-60 overflow-y-auto">
          <RadioGroup
            onValueChange={setSelectedCollection}
            value={selectedCollection || ""}
            className="gap-1"
          >
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center space-x-2 rounded-md p-2 hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem
                  value={collection.id.toString()}
                  id={`collection-${collection.id}`}
                  className="border-slate-600 data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-600"
                />
                <Label htmlFor={`collection-${collection.id}`} className="cursor-pointer w-full">
                  {collection.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!selectedCollection}
          >
            {t("add")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
