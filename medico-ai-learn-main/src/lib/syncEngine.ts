import { supabase } from "@/integrations/supabase/client";

type SyncStatus = "idle" | "syncing" | "synced" | "error";
let syncStatus: SyncStatus = "idle";
const listeners: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus() { return syncStatus; }
export function onSyncStatusChange(fn: (s: SyncStatus) => void) { listeners.add(fn); return () => listeners.delete(fn); }
function setSyncStatus(s: SyncStatus) { syncStatus = s; listeners.forEach(fn => fn(s)); }

let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Debounced sync to cloud
export function syncToCloud(table: string, getData: () => any) {
  if (debounceTimers[table]) clearTimeout(debounceTimers[table]);
  debounceTimers[table] = setTimeout(async () => {
    const userId = await getUserId();
    if (!userId) return;
    setSyncStatus("syncing");
    try {
      await syncTableToCloud(table, userId, getData());
      setSyncStatus("synced");
    } catch (e) {
      console.error(`Sync error [${table}]:`, e);
      setSyncStatus("error");
    }
  }, 2000);
}

async function syncTableToCloud(table: string, userId: string, data: any) {
  switch (table) {
    case "gamification": {
      const d = data as any;
      await supabase.from("user_gamification").upsert({
        user_id: userId,
        total_xp: d.totalXP || 0,
        daily_xp: d.dailyXP || 0,
        daily_xp_date: d.dailyXPDate || "",
        daily_xp_goal: d.dailyXPGoal || 200,
        history: d.history || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      break;
    }
    case "activity_log": {
      const entries = Object.entries(data as Record<string, any>);
      for (const [date, act] of entries) {
        await supabase.from("user_activity_log").upsert({
          user_id: userId,
          date,
          quiz: (act as any).quiz || false,
          recap: (act as any).recap || false,
          flashcards: (act as any).flashcards || false,
        }, { onConflict: "user_id,date" });
      }
      break;
    }
    case "flashcards": {
      const cards = data as any[];
      // Delete all and re-insert (simple approach)
      await supabase.from("user_flashcards").delete().eq("user_id", userId);
      if (cards.length > 0) {
        const rows = cards.map(c => ({
          user_id: userId,
          term: c.term,
          definition: c.definition,
          subject_id: c.subjectId || "",
          ease_factor: c.easeFactor,
          interval: c.interval,
          repetitions: c.repetitions,
          next_review: c.nextReview ? new Date(c.nextReview).toISOString() : new Date().toISOString(),
          created_at: c.createdAt || new Date().toISOString(),
        }));
        await supabase.from("user_flashcards").insert(rows);
      }
      break;
    }
    case "mistakes": {
      const mistakes = data as any[];
      await supabase.from("user_mistakes").delete().eq("user_id", userId);
      if (mistakes.length > 0) {
        const rows = mistakes.map(m => ({
          user_id: userId,
          question: m.question,
          options: m.options,
          correct_index: m.correctIndex,
          user_answer: m.userAnswer,
          explanation: m.explanation || "",
          subject_id: m.subjectId || "",
          source: m.source || "",
          times_wrong: m.timesWrong || 1,
          times_correct_after: m.timesCorrectAfter || 0,
          created_at: m.timestamp || new Date().toISOString(),
        }));
        await supabase.from("user_mistakes").insert(rows);
      }
      break;
    }
    case "bookmarks": {
      const bmarks = data as any[];
      await supabase.from("user_bookmarks").delete().eq("user_id", userId);
      if (bmarks.length > 0) {
        const rows = bmarks.map(b => ({
          user_id: userId,
          question: b.question,
          options: b.options,
          correct_index: b.correctIndex,
          explanation: b.explanation || "",
          book_reference: b.bookReference || "",
          subject_id: b.subjectId || "",
          user_answer: b.userAnswer || 0,
          saved_at: b.savedAt || new Date().toISOString(),
        }));
        await supabase.from("user_bookmarks").insert(rows);
      }
      break;
    }
    case "notes": {
      const notes = data as any[];
      await supabase.from("user_notes").delete().eq("user_id", userId);
      if (notes.length > 0) {
        const rows = notes.map(n => ({
          user_id: userId,
          subject_id: n.subjectId || "",
          title: n.title,
          content: n.content || "",
          created_at: n.createdAt || new Date().toISOString(),
          updated_at: n.updatedAt || new Date().toISOString(),
        }));
        await supabase.from("user_notes").insert(rows);
      }
      break;
    }
    case "test_marks": {
      const marks = data as any[];
      await supabase.from("user_test_marks").delete().eq("user_id", userId);
      if (marks.length > 0) {
        const rows = marks.map(m => ({
          user_id: userId,
          subject_id: m.subjectId || "",
          test_name: m.testName || "",
          test_type: m.testType || "",
          marks_obtained: m.marksObtained || 0,
          total_marks: m.totalMarks || 100,
          faculty_name: m.facultyName || "",
          date: m.date || "",
          remarks: m.remarks || "",
          created_at: m.createdAt || new Date().toISOString(),
        }));
        await supabase.from("user_test_marks").insert(rows);
      }
      break;
    }
    case "progress": {
      const entries = Object.entries(data as Record<string, any>);
      for (const [subjectId, p] of entries) {
        const prog = p as any;
        await supabase.from("user_progress").upsert({
          user_id: userId,
          subject_id: subjectId,
          questions_attempted: prog.questionsAttempted || 0,
          questions_correct: prog.questionsCorrect || 0,
          topics_reviewed: prog.topicsReviewed || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,subject_id" });
      }
      break;
    }
    case "quiz_history": {
      const entries = Object.entries(data as Record<string, any>);
      await supabase.from("user_quiz_history").delete().eq("user_id", userId);
      if (entries.length > 0) {
        const rows = entries.map(([date, v]) => ({
          user_id: userId,
          quiz_date: date,
          score: (v as any).score || 0,
          total: (v as any).total || 0,
        }));
        await supabase.from("user_quiz_history").insert(rows);
      }
      break;
    }
    case "pomodoro": {
      const sessions = data as any[];
      await supabase.from("user_pomodoro_sessions").delete().eq("user_id", userId);
      if (sessions.length > 0) {
        const rows = sessions.map(s => ({
          user_id: userId,
          date: s.date,
          completed_at: s.completedAt || new Date().toISOString(),
          duration_minutes: s.durationMinutes || 25,
          subject_id: s.subjectId || "",
        }));
        await supabase.from("user_pomodoro_sessions").insert(rows);
      }
      break;
    }
    case "study_hours": {
      const logs = data as any[];
      for (const l of logs) {
        await supabase.from("user_study_hours").upsert({
          user_id: userId,
          date: l.date,
          hours_studied: l.hoursStudied || 0,
        }, { onConflict: "user_id,date" });
      }
      break;
    }
    case "study_plans": {
      const plans = data as any[];
      await supabase.from("user_study_plans").delete().eq("user_id", userId);
      if (plans.length > 0) {
        const rows = plans.map(p => ({
          user_id: userId,
          exam_name: p.examName || "",
          exam_date: p.examDate || "",
          subjects: p.subjects || [],
          days: p.days || [],
          created_at: p.createdAt || new Date().toISOString(),
        }));
        await supabase.from("user_study_plans").insert(rows);
      }
      break;
    }
    case "profile": {
      const d = data as any;
      await supabase.from("profiles").upsert({
        id: userId,
        student_name: d.studentName || "",
        year_of_study: d.yearOfStudy || "",
        exam_date: d.examDate || "",
        exam_name: d.examName || "",
        settings_json: d.settingsJson || {},
        updated_at: new Date().toISOString(),
      });
      break;
    }
  }
}

// Pull all data from cloud to localStorage on login
export async function syncFromCloud(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  setSyncStatus("syncing");
  try {
    // Profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profile) {
      if (profile.student_name) localStorage.setItem("dentai-student-name", JSON.stringify(profile.student_name));
      if (profile.year_of_study) localStorage.setItem("dentai-year", JSON.stringify(profile.year_of_study));
      if (profile.exam_date) localStorage.setItem("dentai-exam-date", JSON.stringify(profile.exam_date));
      if (profile.exam_name) localStorage.setItem("dentai-exam-name", JSON.stringify(profile.exam_name));
      if ((profile as any).course === "mbbs" || (profile as any).course === "bds") {
        localStorage.setItem("medicoai-course", JSON.stringify((profile as any).course));
      }
      if (Array.isArray((profile as any).selected_subject_ids) && (profile as any).selected_subject_ids.length > 0) {
        localStorage.setItem("medicoai-selected-subjects", JSON.stringify((profile as any).selected_subject_ids));
      }
      // Restore weekly goals and other settings from settings_json
      if (profile.settings_json && typeof profile.settings_json === "object") {
        const sj = profile.settings_json as Record<string, any>;
        if (sj.weeklyGoals) localStorage.setItem("dentai-weekly-goals", JSON.stringify(sj.weeklyGoals));
        if (sj.focusSubjects) localStorage.setItem("dentai-focus-subjects", JSON.stringify(sj.focusSubjects));
        if (sj.aiPreferences) localStorage.setItem("dentai-ai-preferences", JSON.stringify(sj.aiPreferences));
      }
    }

    // Gamification
    const { data: gam } = await supabase.from("user_gamification").select("*").eq("user_id", userId).maybeSingle();
    if (gam) {
      localStorage.setItem("dentai-gamification", JSON.stringify({
        totalXP: gam.total_xp,
        dailyXP: gam.daily_xp,
        dailyXPDate: gam.daily_xp_date,
        dailyXPGoal: gam.daily_xp_goal,
        history: gam.history || [],
      }));
    }

    // Progress
    const { data: progressRows } = await supabase.from("user_progress").select("*").eq("user_id", userId);
    if (progressRows && progressRows.length > 0) {
      const progress: Record<string, any> = {};
      progressRows.forEach(r => {
        progress[r.subject_id] = {
          questionsAttempted: r.questions_attempted,
          questionsCorrect: r.questions_correct,
          topicsReviewed: r.topics_reviewed || [],
        };
      });
      localStorage.setItem("dentai-subject-progress", JSON.stringify(progress));
    }

    // Activity log
    const { data: actRows } = await supabase.from("user_activity_log").select("*").eq("user_id", userId);
    if (actRows && actRows.length > 0) {
      const log: Record<string, any> = {};
      actRows.forEach(r => { log[r.date] = { quiz: r.quiz, recap: r.recap, flashcards: r.flashcards }; });
      localStorage.setItem("dentai-activity-log", JSON.stringify(log));
    }

    // Flashcards
    const { data: cards } = await supabase.from("user_flashcards").select("*").eq("user_id", userId);
    if (cards && cards.length > 0) {
      const flashcards = cards.map(c => ({
        id: c.id,
        term: c.term,
        definition: c.definition,
        subjectId: c.subject_id,
        easeFactor: c.ease_factor,
        interval: c.interval,
        repetitions: c.repetitions,
        nextReview: c.next_review ? new Date(c.next_review).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        createdAt: c.created_at,
      }));
      localStorage.setItem("dentai-flashcards", JSON.stringify(flashcards));
    }

    // Mistakes
    const { data: mistakes } = await supabase.from("user_mistakes").select("*").eq("user_id", userId);
    if (mistakes && mistakes.length > 0) {
      const mapped = mistakes.map(m => ({
        id: m.id,
        question: m.question,
        options: m.options,
        correctIndex: m.correct_index,
        userAnswer: m.user_answer,
        explanation: m.explanation,
        subjectId: m.subject_id,
        source: m.source,
        timestamp: m.created_at,
        timesWrong: m.times_wrong,
        timesCorrectAfter: m.times_correct_after,
      }));
      localStorage.setItem("dentai-mistake-log", JSON.stringify(mapped));
    }

    // Bookmarks
    const { data: bmarks } = await supabase.from("user_bookmarks").select("*").eq("user_id", userId);
    if (bmarks && bmarks.length > 0) {
      const mapped = bmarks.map(b => ({
        id: b.id,
        question: b.question,
        options: b.options,
        correctIndex: b.correct_index,
        explanation: b.explanation,
        bookReference: b.book_reference,
        subjectId: b.subject_id,
        userAnswer: b.user_answer,
        savedAt: b.saved_at,
      }));
      localStorage.setItem("dentai-bookmarks", JSON.stringify(mapped));
    }

    // Notes
    const { data: notes } = await supabase.from("user_notes").select("*").eq("user_id", userId);
    if (notes && notes.length > 0) {
      const mapped = notes.map(n => ({
        id: n.id,
        subjectId: n.subject_id,
        title: n.title,
        content: n.content,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));
      localStorage.setItem("dentai-study-notes", JSON.stringify(mapped));
    }

    // Test marks
    const { data: marks } = await supabase.from("user_test_marks").select("*").eq("user_id", userId);
    if (marks && marks.length > 0) {
      const mapped = marks.map(m => ({
        id: m.id,
        subjectId: m.subject_id,
        testName: m.test_name,
        testType: m.test_type,
        marksObtained: m.marks_obtained,
        totalMarks: m.total_marks,
        facultyName: m.faculty_name,
        date: m.date,
        remarks: m.remarks,
        createdAt: m.created_at,
      }));
      localStorage.setItem("dentai-test-marks", JSON.stringify(mapped));
    }

    // Quiz history
    const { data: quizRows } = await supabase.from("user_quiz_history").select("*").eq("user_id", userId);
    if (quizRows && quizRows.length > 0) {
      const history: Record<string, any> = {};
      quizRows.forEach(r => { history[r.quiz_date] = { score: r.score, total: r.total }; });
      localStorage.setItem("dentai-quiz-history", JSON.stringify(history));
    }

    // Pomodoro
    const { data: pomSessions } = await supabase.from("user_pomodoro_sessions").select("*").eq("user_id", userId);
    if (pomSessions && pomSessions.length > 0) {
      const mapped = pomSessions.map(s => ({
        date: s.date,
        completedAt: s.completed_at,
        durationMinutes: s.duration_minutes,
        subjectId: s.subject_id,
      }));
      localStorage.setItem("dentai-pomodoro-sessions", JSON.stringify(mapped));
    }

    // Study hours
    const { data: hoursRows } = await supabase.from("user_study_hours").select("*").eq("user_id", userId);
    if (hoursRows && hoursRows.length > 0) {
      const mapped = hoursRows.map(h => ({ date: h.date, hoursStudied: h.hours_studied }));
      localStorage.setItem("dentai-study-hours-log", JSON.stringify(mapped));
    }

    // Study plans
    const { data: plans } = await supabase.from("user_study_plans").select("*").eq("user_id", userId);
    if (plans && plans.length > 0) {
      const mapped = plans.map(p => ({
        id: p.id,
        examName: p.exam_name,
        examDate: p.exam_date,
        subjects: p.subjects,
        days: p.days,
        createdAt: p.created_at,
      }));
      localStorage.setItem("dentai-study-plans", JSON.stringify(mapped));
    }

    setSyncStatus("synced");
    return true;
  } catch (e) {
    console.error("Sync from cloud error:", e);
    setSyncStatus("error");
    return false;
  }
}

// Full push: push all localStorage data to cloud
export async function pushAllToCloud() {
  const userId = await getUserId();
  if (!userId) return;

  setSyncStatus("syncing");
  try {
    // Profile
    const studentName = localStorage.getItem("dentai-student-name");
    const yearOfStudy = localStorage.getItem("dentai-year");
    const examDate = localStorage.getItem("dentai-exam-date");
    const examName = localStorage.getItem("dentai-exam-name");
    const weeklyGoalsRaw = localStorage.getItem("dentai-weekly-goals");
    const focusSubjectsRaw = localStorage.getItem("dentai-focus-subjects");
    const aiPrefsRaw = localStorage.getItem("dentai-ai-preferences");
    const settingsJson: Record<string, any> = {};
    if (weeklyGoalsRaw) settingsJson.weeklyGoals = JSON.parse(weeklyGoalsRaw);
    if (focusSubjectsRaw) settingsJson.focusSubjects = JSON.parse(focusSubjectsRaw);
    if (aiPrefsRaw) settingsJson.aiPreferences = JSON.parse(aiPrefsRaw);
    await syncTableToCloud("profile", userId, {
      studentName: studentName ? JSON.parse(studentName) : "",
      yearOfStudy: yearOfStudy ? JSON.parse(yearOfStudy) : "",
      examDate: examDate ? JSON.parse(examDate) : "",
      examName: examName ? JSON.parse(examName) : "",
      settingsJson,
    });

    // Gamification
    const gamRaw = localStorage.getItem("dentai-gamification");
    if (gamRaw) await syncTableToCloud("gamification", userId, JSON.parse(gamRaw));

    // Progress
    const progressRaw = localStorage.getItem("dentai-subject-progress");
    if (progressRaw) await syncTableToCloud("progress", userId, JSON.parse(progressRaw));

    // Activity log
    const actRaw = localStorage.getItem("dentai-activity-log");
    if (actRaw) await syncTableToCloud("activity_log", userId, JSON.parse(actRaw));

    // Flashcards
    const cardsRaw = localStorage.getItem("dentai-flashcards");
    if (cardsRaw) await syncTableToCloud("flashcards", userId, JSON.parse(cardsRaw));

    // Mistakes
    const mistakesRaw = localStorage.getItem("dentai-mistake-log");
    if (mistakesRaw) await syncTableToCloud("mistakes", userId, JSON.parse(mistakesRaw));

    // Bookmarks
    const bookmarksRaw = localStorage.getItem("dentai-bookmarks");
    if (bookmarksRaw) await syncTableToCloud("bookmarks", userId, JSON.parse(bookmarksRaw));

    // Notes
    const notesRaw = localStorage.getItem("dentai-study-notes");
    if (notesRaw) await syncTableToCloud("notes", userId, JSON.parse(notesRaw));

    // Test marks
    const marksRaw = localStorage.getItem("dentai-test-marks");
    if (marksRaw) await syncTableToCloud("test_marks", userId, JSON.parse(marksRaw));

    // Quiz history
    const quizRaw = localStorage.getItem("dentai-quiz-history");
    if (quizRaw) await syncTableToCloud("quiz_history", userId, JSON.parse(quizRaw));

    // Pomodoro
    const pomRaw = localStorage.getItem("dentai-pomodoro-sessions");
    if (pomRaw) await syncTableToCloud("pomodoro", userId, JSON.parse(pomRaw));

    // Study hours
    const hoursRaw = localStorage.getItem("dentai-study-hours-log");
    if (hoursRaw) await syncTableToCloud("study_hours", userId, JSON.parse(hoursRaw));

    // Study plans
    const plansRaw = localStorage.getItem("dentai-study-plans");
    if (plansRaw) await syncTableToCloud("study_plans", userId, JSON.parse(plansRaw));

    setSyncStatus("synced");
  } catch (e) {
    console.error("Push all to cloud error:", e);
    setSyncStatus("error");
  }
}
