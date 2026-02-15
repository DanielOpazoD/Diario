# domain/ — Pure Business Logic

> Contains business rules with **zero** framework or infrastructure dependencies. Only imports from `@shared/*`.

## Structure

```
domain/
├── patient/
│   ├── patientDomain.ts          # Patient entity creation & validation
│   ├── patientTextExtraction.ts  # Extract patient data from PDF text
│   ├── patientSanitization.ts    # Input sanitization (XSS, special chars)
│   ├── patientValidation.ts      # RUT validation, field checks
│   ├── mergeExtracted.ts         # Merge extracted data with existing record
│   └── patientUtils.ts           # Name formatting, normalization
│
├── report/
│   ├── reportDomain.ts           # Report structure and rules
│   ├── reportFilters.ts          # Patient filtering for reports
│   ├── reportFormatter.ts        # Data formatting for display
│   ├── reportPdf.ts              # PDF generation logic
│   ├── reportPrint.ts            # Print-specific formatting
│   ├── reportRichText.ts         # Rich text sanitization
│   ├── reportToolbar.ts          # Toolbar configuration
│   └── reportUtils.ts            # Report helper functions
│
├── bookmarks.ts                  # Bookmark CRUD, ordering, categories
└── tasks.ts                      # General task creation logic
```

## Key Domain Rules

### Patient Text Extraction (`patientTextExtraction.ts`)
The most complex domain module. Handles Chilean medical PDF formats:
- **NAME_LINE_PATTERN** — Regex matching "Nombre:", "Paciente:", etc.
- **extractNameFromTableFormat()** — Handles "NOMBRES:" table headers where name is on the next line
- **isLikelyName()** — Rejects medical terms (blocklist of 30+ terms), strips punctuation, accent-normalizes
- **extractSection()** — Extracts text between two labels (e.g., "HIPOTESIS DIAGNÓSTICA:" → "INDICACIONES MÉDICAS")
- **extractDiagnosis()** — Falls back through multiple diagnosis label patterns

### Patient Validation (`patientValidation.ts`)
- Chilean RUT validation (modulo-11 algorithm)
- Required field checks
- Date format validation

### Patient Sanitization (`patientSanitization.ts`)
- HTML tag stripping
- Special character normalization
- Name title-case formatting
- Whitespace cleanup
