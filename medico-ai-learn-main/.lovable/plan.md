## Plan

1. **Make Ask a Doubt read the student’s course and selected subjects**
   - Use the existing onboarding values for `medicoai-course`, `dentai-year`, and `medicoai-selected-subjects`.
   - Reuse `useUserSubjects()` so the doubt page only sees the subjects the student actually selected.

2. **Replace dental-only empty-state text and suggestions**
   - Change “Get answers from your dental textbooks” to course-aware copy for MBBS/BDS.
   - Generate suggestion chips from the selected subjects instead of hardcoded dental prompts like enamel/TMJ/tooth development.
   - Example MBBS Anatomy suggestions: gross anatomy, brachial plexus, cranial nerves, blood supply, histology/embryology as relevant.
   - Example BDS suggestions stay dental-focused when BDS is selected.

3. **Send course + subject + textbook context into the AI chat request**
   - Extend the chat client payload to include the active course, active subjects, and their textbook/author list.
   - Update the chat backend/function so MedicoAI answers as an MBBS tutor for MBBS students and BDS tutor for BDS students.
   - Ensure source tags reference the relevant MBBS/BDS textbook list, not only dental books.

4. **Remove dental-only mode labels and fallback prompts**
   - Rename “Brief Dental / Detailed Dental” to neutral “Brief / Detailed”.
   - Replace image fallback text like “dental studies” with course-aware “MBBS studies” or “BDS studies”.
   - Keep the general answer modes but make the default subject/course-aware.

5. **Textbook coverage behavior**
   - Use the existing subject catalog as the app’s textbook-access list for all MBBS and BDS years.
   - If a student asks outside their selected subjects, the AI can still answer from general medical knowledge and clearly label it.
   - Note: this will make the AI aware of all configured MBBS/BDS textbook references; it does not add full copyrighted textbook PDFs unless those are provided separately.

6. **Verify the fixed flow**
   - Check the Ask a Doubt page after MBBS selection shows MBBS-relevant suggestions.
   - Confirm the request payload includes MBBS course and selected subject textbook context.
   - Search for remaining dental-only text in the doubt flow and remove/neutralize it where it affects MBBS users.