"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SpeedDialProps {
  currentRate: number;
  onRateChange: (rate: number) => void;
  availableRates?: number[];
}

const defaultRates = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

export function SpeedDial({
  currentRate,
  onRateChange,
  availableRates = defaultRates,
}: SpeedDialProps) {
  const handleValueChange = (value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate)) {
      onRateChange(rate);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-24 bg-black/70 text-white border-none hover:bg-black"
        >
          ×{currentRate.toFixed(2)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-24 bg-black/80 text-white border-none">
        <DropdownMenuRadioGroup
          value={currentRate.toString()}
          onValueChange={handleValueChange}
        >
          {availableRates.map((rate) => (
            <DropdownMenuRadioItem
              key={rate}
              value={rate.toString()}
              className="focus:bg-gray-700 focus:text-white"
            >
              ×{rate.toFixed(2)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
