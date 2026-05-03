import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { generateId } from "@/src/lib/utils";

export function useTrafficTracker() {
  const location = useLocation();
  const params = useParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if the path actually changed
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;

    const trackPageView = async () => {
      try {
        // Get or create visitor ID (persists across sessions)
        let visitorId = localStorage.getItem("bt_visitor_id");
        if (!visitorId) {
          visitorId = generateId();
          localStorage.setItem("bt_visitor_id", visitorId);
        }

        // Get or create session ID (exists for current browser session)
        let sessionId = sessionStorage.getItem("bt_session_id");
        if (!sessionId) {
          sessionId = generateId();
          sessionStorage.setItem("bt_session_id", sessionId);
        }

        // Determine business ID if on a business-specific route
        // Possible routes: /w/:businessId, /dashboard/* (needs auth profile)
        let businessId: string | null = params.businessId || null;

        // If we're on a dashboard route, we'll try to get businessId from the profile later
        // But for now, we just log what we can. Standard page views might not have a businessId.

        await supabase.from("page_views").insert({
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          business_id: businessId,
        });
      } catch (error) {
        // Silently fail to not disrupt user experience
        console.warn("Traffic tracking failed:", error);
      }
    };

    trackPageView();
  }, [location.pathname, params.businessId]);
}
