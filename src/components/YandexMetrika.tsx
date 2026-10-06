import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { hitPage } from "@/app/lib/metrics";

export function YandexMetrika() {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    hitPage(window.location.href, document.title, document.referrer);
  }, [location.pathname, location.search]);

  return null;
}