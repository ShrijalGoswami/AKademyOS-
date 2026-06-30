"use client";

import { useState, useEffect } from "react";

interface Props {
  date: string | Date;
  showTime?: boolean;
}

export function LocalDate({ date, showTime = true }: Props) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    
    if (showTime) {
      setFormatted(d.toLocaleString());
    } else {
      setFormatted(d.toLocaleDateString());
    }
  }, [date, showTime]);

  const fallback = new Date(date);
  const fallbackStr = isNaN(fallback.getTime()) 
    ? "" 
    : showTime 
      ? fallback.toUTCString() 
      : fallback.toUTCString().slice(0, 16);

  return <span suppressHydrationWarning>{formatted || fallbackStr}</span>;
}
