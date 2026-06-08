import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { hasCompletedOnboarding, setCurrentCourse, setSelectedSubjectIds } from "@/lib/subjects";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  // "checking" = still fetching profile from DB, "done" = resolved
  const [onboardingCheck, setOnboardingCheck] = useState<"checking" | "done">(
    hasCompletedOnboarding() ? "done" : "checking"
  );

  useEffect(() => {
    // If localStorage already has onboarding data, skip DB check
    if (hasCompletedOnboarding()) {
      setOnboardingCheck("done");
      return;
    }

    // No local data → check Supabase profile
    if (!user) {
      setOnboardingCheck("done");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("course, year_of_study, selected_subject_ids, onboarded_at, student_name")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profile?.onboarded_at) {
          // Student already completed onboarding on another device — restore to localStorage
          const course = profile.course as "mbbs" | "bds";
          if (course === "mbbs" || course === "bds") {
            setCurrentCourse(course);
          }
          if (profile.year_of_study) {
            localStorage.setItem("dentai-year", JSON.stringify(profile.year_of_study));
          }
          if (Array.isArray(profile.selected_subject_ids) && profile.selected_subject_ids.length > 0) {
            setSelectedSubjectIds(profile.selected_subject_ids);
          }
          if (profile.student_name) {
            localStorage.setItem("dentai-student-name", JSON.stringify(profile.student_name));
          }
        }
      } catch (e) {
        console.error("Profile check failed:", e);
      } finally {
        if (!cancelled) setOnboardingCheck("done");
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (loading || onboardingCheck === "checking") {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCompletedOnboarding() && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children || <Outlet />}</>;
}

